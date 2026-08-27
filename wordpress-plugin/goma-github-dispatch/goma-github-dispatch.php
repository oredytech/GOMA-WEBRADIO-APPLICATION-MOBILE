<?php
/**
 * Plugin Name: GOMA - FCM Article Notifications
 * Description: Envoie une notification FCM lors de la publication d'un contenu WordPress.
 * Version: 1.0.0
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * Author: GOMA Webradio
 * License: GPL-2.0-or-later
 */

defined('ABSPATH') || exit;

const GOMA_GHD_OPTION = 'goma_ghd_settings';
const GOMA_GHD_LOG_OPTION = 'goma_ghd_log';
const GOMA_GHD_NONCE = 'goma_ghd_save_settings';
const GOMA_GHD_QUEUE_OPTION = 'goma_ghd_pending_posts';
const GOMA_GHD_QUEUE_HOOK = 'goma_ghd_dispatch_pending_posts';
const GOMA_GHD_DATABASE_TOKEN_TRANSIENT = 'goma_ghd_database_access_token';
const GOMA_GHD_FCM_TOKEN_TRANSIENT = 'goma_ghd_fcm_access_token';
const GOMA_GHD_RETRY_DELAY = 5 * MINUTE_IN_SECONDS;

function goma_ghd_defaults() {
    return array(
        'enabled' => 1,
        'service_account_json' => '',
        'database_url' => 'https://app-goma-webradio-default-rtdb.europe-west1.firebasedatabase.app',
        'project_id' => 'app-goma-webradio',
        'app_url' => 'https://app.gomawebradio.com',
        'tokens_path' => 'fcmTokens',
        'article_path' => 'articles/{slug}',
        'notification_title' => 'Nouvel article',
        'post_types' => 'post',
    );
}

function goma_ghd_settings() {
    return wp_parse_args((array) get_option(GOMA_GHD_OPTION, array()), goma_ghd_defaults());
}

function goma_ghd_log($message, $success = true) {
    $log = (array) get_option(GOMA_GHD_LOG_OPTION, array());
    array_unshift($log, array(
        'time' => current_time('mysql'),
        'success' => (bool) $success,
        'message' => sanitize_text_field($message),
    ));
    update_option(GOMA_GHD_LOG_OPTION, array_slice($log, 0, 30), false);
}

function goma_ghd_valid_settings($settings) {
    $account = json_decode((string) $settings['service_account_json'], true);
    return is_array($account) && json_last_error() === JSON_ERROR_NONE && !empty($account['project_id']) && !empty($account['client_email']) && !empty($account['private_key']) && !empty($settings['project_id']) && $account['project_id'] === $settings['project_id'];
}

function goma_ghd_base64url($value) {
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}

function goma_ghd_access_token($scope, $transient_key) {
    $settings = goma_ghd_settings();
    $account = json_decode((string) $settings['service_account_json'], true);
    $cached = get_transient($transient_key);
    if (is_string($cached) && $cached !== '') return $cached;
    $now = time();
    $header = goma_ghd_base64url(wp_json_encode(array('alg' => 'RS256', 'typ' => 'JWT')));
    $claims = goma_ghd_base64url(wp_json_encode(array(
        'iss' => $account['client_email'],
        'scope' => $scope,
        'aud' => 'https://oauth2.googleapis.com/token',
        'iat' => $now,
        'exp' => $now + 3600,
    )));
    $unsigned = $header . '.' . $claims;
    if (!openssl_sign($unsigned, $signature, $account['private_key'], OPENSSL_ALGO_SHA256)) {
        return new WP_Error('fcm_signing_failed', 'La signature du compte de service Firebase a échoué.');
    }
    $response = wp_remote_post('https://oauth2.googleapis.com/token', array(
        'timeout' => 20,
        'body' => array(
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $unsigned . '.' . goma_ghd_base64url($signature),
        ),
    ));
    if (is_wp_error($response)) return $response;
    $data = json_decode(wp_remote_retrieve_body($response), true);
    if (wp_remote_retrieve_response_code($response) !== 200 || empty($data['access_token'])) {
        $detail = is_array($data) && !empty($data['error_description']) ? ': ' . sanitize_text_field((string) $data['error_description']) : '';
        return new WP_Error('fcm_auth_failed', 'Google OAuth a refusé le compte de service' . $detail . '.');
    }
    set_transient($transient_key, $data['access_token'], 50 * MINUTE_IN_SECONDS);
    return $data['access_token'];
}

function goma_ghd_fcm_tokens($access_token) {
    $settings = goma_ghd_settings();
    $tokens_path = trim((string) $settings['tokens_path'], " /\t\n\r\0\x0B");
    $url = trailingslashit($settings['database_url']) . $tokens_path . '.json?access_token=' . rawurlencode($access_token);
    $response = wp_remote_get($url, array(
        'timeout' => 20,
        'headers' => array('Accept' => 'application/json'),
    ));
    if (is_wp_error($response)) return $response;
    if (wp_remote_retrieve_response_code($response) !== 200) {
        $body = json_decode(wp_remote_retrieve_body($response), true);
        $detail = is_array($body) && !empty($body['error']) ? ': ' . sanitize_text_field((string) $body['error']) : '';
        if (wp_remote_retrieve_response_code($response) === 401) {
            $detail .= ' Vérifie la clé privée, le rôle IAM Firebase Realtime Database Viewer et les règles de lecture.';
        }
        return new WP_Error('fcm_database_failed', 'Firebase Realtime Database a répondu avec le code ' . wp_remote_retrieve_response_code($response) . $detail . '.');
    }
    $records = json_decode(wp_remote_retrieve_body($response), true);
    if (!is_array($records)) {
        return new WP_Error('fcm_tokens_empty', 'Firebase a renvoyé une réponse vide ou invalide pour ' . $tokens_path . '.');
    }
    if (isset($records[$tokens_path]) && is_array($records[$tokens_path])) {
        $records = $records[$tokens_path];
    }
    $tokens = array();
    foreach ((array) $records as $record_key => $entry) {
        if (is_string($entry) && $entry !== '') {
            $tokens[] = array('key' => (string) $record_key, 'token' => $entry);
        } elseif (is_array($entry) && !empty($entry['token']) && is_string($entry['token'])) {
            $tokens[] = array('key' => (string) $record_key, 'token' => $entry['token']);
        }
    }
    if (!$tokens) {
        $keys = array_slice(array_map('sanitize_key', array_keys($records)), 0, 5);
        $hint = $keys ? ' Clés reçues : ' . implode(', ', $keys) . '.' : ' Réponse reçue sans enregistrement.';
        return new WP_Error('fcm_tokens_empty', 'Aucun champ token trouvé sous ' . $tokens_path . '.' . $hint);
    }
    $unique = array();
    foreach ($tokens as $entry) $unique[$entry['token']] = $entry;
    return array_values($unique);
}

function goma_ghd_fcm_delete_token($access_token, $key) {
    $settings = goma_ghd_settings();
    $path = implode('/', array_map('rawurlencode', explode('/', trim((string) $settings['tokens_path'], " /\t\n\r\0\x0B"))));
    $url = trailingslashit($settings['database_url']) . $path . '/' . rawurlencode($key) . '.json?access_token=' . rawurlencode($access_token);
    return wp_remote_request($url, array('method' => 'DELETE', 'timeout' => 20));
}

function goma_ghd_fcm_send($payload) {
    $settings = goma_ghd_settings();
    $database_access_token = goma_ghd_access_token(
        'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/firebase.database',
        GOMA_GHD_DATABASE_TOKEN_TRANSIENT
    );
    if (is_wp_error($database_access_token)) return $database_access_token;
    $tokens = goma_ghd_fcm_tokens($database_access_token);
    if (is_wp_error($tokens)) return $tokens;
    $access_token = goma_ghd_access_token(
        'https://www.googleapis.com/auth/cloud-platform',
        GOMA_GHD_FCM_TOKEN_TRANSIENT
    );
    if (is_wp_error($access_token)) return $access_token;
    if (!$tokens) return array('sent' => 0, 'failed' => 0, 'removed' => 0, 'total' => 0, 'errors' => array());
    $stats = array('sent' => 0, 'failed' => 0, 'removed' => 0, 'total' => count($tokens), 'errors' => array());
    foreach ($tokens as $entry) {
        $response = wp_remote_post('https://fcm.googleapis.com/v1/projects/' . rawurlencode($settings['project_id']) . '/messages:send', array(
            'timeout' => 20,
            'headers' => array('Authorization' => 'Bearer ' . $access_token, 'Content-Type' => 'application/json'),
            'body' => wp_json_encode(array('message' => array_merge($payload, array('token' => $entry['token'])))),
        ));
        if (!is_wp_error($response) && wp_remote_retrieve_response_code($response) >= 200 && wp_remote_retrieve_response_code($response) < 300) {
            $stats['sent']++;
            continue;
        }
        $stats['failed']++;
        if (is_wp_error($response)) {
            $error_message = 'Réseau : ' . $response->get_error_message();
            $stats['errors'][$error_message] = ($stats['errors'][$error_message] ?? 0) + 1;
            continue;
        }
        $status_code = wp_remote_retrieve_response_code($response);
        $body = json_decode(wp_remote_retrieve_body($response), true);
        $error_status = is_array($body) ? (string) ($body['error']['status'] ?? '') : '';
        $error_message = is_array($body) ? (string) ($body['error']['message'] ?? '') : '';
        $error_label = $error_status ?: 'HTTP ' . $status_code;
        if ($error_message) $error_label .= ': ' . sanitize_text_field($error_message);
        $stats['errors'][$error_label] = ($stats['errors'][$error_label] ?? 0) + 1;
        if (in_array($error_status, array('UNREGISTERED', 'INVALID_ARGUMENT'), true) && $entry['key'] !== '') {
            $deleted = goma_ghd_fcm_delete_token($access_token, $entry['key']);
            if (!is_wp_error($deleted) && wp_remote_retrieve_response_code($deleted) >= 200 && wp_remote_retrieve_response_code($deleted) < 300) $stats['removed']++;
        }
    }
    return $stats;
}

function goma_ghd_dispatch($post_id, $is_test = false) {
    $settings = goma_ghd_settings();
    if (!$settings['enabled'] && !$is_test) {
        return false;
    }
    if (!goma_ghd_valid_settings($settings)) {
        goma_ghd_log('Configuration Firebase incomplète.', false);
        return false;
    }

    $post = $post_id ? get_post($post_id) : null;
    if (!$post && !$is_test) {
        goma_ghd_log('Contenu introuvable pour l\'ID ' . $post_id . '.', false);
        return false;
    }

    $image = $post ? get_the_post_thumbnail_url($post_id, 'full') : '';
    $title = $post ? wp_strip_all_tags(get_the_title($post_id)) : 'Notification de test FCM';
    $slug = $post ? (string) $post->post_name : '';
    $article_url = $post
        ? trailingslashit($settings['app_url']) . ltrim(str_replace('{slug}', rawurlencode($slug), (string) $settings['article_path']), '/')
        : trailingslashit($settings['app_url']);
    $payload = array(
        'article_id' => $post ? (string) $post->ID : 'test',
        'post_id' => $post ? (string) $post->ID : 'test',
        'post_type' => $post ? (string) $post->post_type : 'test',
        'slug' => $slug,
        'title' => $title,
        'url' => $article_url,
        'image' => $image ? esc_url_raw($image) : '',
        'published_at' => $post ? get_post_time('c', true, $post) : current_time('c', true),
        'site_url' => home_url('/'),
        'test' => (bool) $is_test,
    );

    $notification = array('title' => $payload['title'], 'body' => (string) $settings['notification_title']);
    if ($payload['image']) $notification['image'] = $payload['image'];
    $notification_id = 'goma-article-' . $payload['article_id'];
    $webpush_notification = array(
        'title' => $payload['title'],
        'body' => (string) $settings['notification_title'],
        'icon' => trailingslashit($settings['app_url']) . 'logo.png',
        'badge' => trailingslashit($settings['app_url']) . 'notification-badge.png',
        'tag' => $notification_id,
    );
    if ($payload['image']) $webpush_notification['image'] = $payload['image'];
    $result = goma_ghd_fcm_send(array(
        'notification' => $notification,
        'data' => array('url' => (string) $payload['url'], 'image' => (string) $payload['image'], 'article_id' => (string) $payload['article_id'], 'notification_id' => $notification_id),
        'webpush' => array(
            'fcm_options' => array('link' => (string) $payload['url']),
            'notification' => $webpush_notification,
        ),
    ));
    if (is_wp_error($result)) {
        goma_ghd_log('Erreur FCM : ' . $result->get_error_message(), false);
        return false;
    }
    if (!$result['total']) {
        goma_ghd_log('Aucun token FCM lisible dans Firebase sous ' . $settings['tokens_path'] . '.', false);
        return false;
    }
    $success = $result['sent'] > 0;
    $error_detail = $result['errors'] ? ' Erreurs : ' . implode(' | ', array_map(function ($message, $count) {
        return $count . 'x ' . $message;
    }, array_keys($result['errors']), array_values($result['errors']))) : '';
    goma_ghd_log(($is_test ? 'Test' : 'Notification FCM') . ' pour le contenu ' . $post_id . ' : ' . $result['sent'] . '/' . $result['total'] . ' envoyé(s), ' . $result['failed'] . ' échec(s), ' . $result['removed'] . ' token(s) supprimé(s).' . $error_detail, $success);
    return $success;
}

function goma_ghd_dispatch_pending_posts() {
    $post_ids = array_values(array_unique(array_map('absint', (array) get_option(GOMA_GHD_QUEUE_OPTION, array()))));
    delete_option(GOMA_GHD_QUEUE_OPTION);
    if (!$post_ids) return;
    $settings = goma_ghd_settings();
    if (!$settings['enabled'] || !goma_ghd_valid_settings($settings)) {
        goma_ghd_log('File d’articles ignorée : configuration Firebase incomplète ou envoi désactivé.', false);
        return;
    }
    $failed = array();
    foreach ($post_ids as $post_id) {
        if (!goma_ghd_dispatch($post_id)) $failed[] = $post_id;
    }
    $new_posts = (array) get_option(GOMA_GHD_QUEUE_OPTION, array());
    $remaining = array_values(array_unique(array_map('absint', array_merge($failed, $new_posts))));
    if ($remaining) {
        update_option(GOMA_GHD_QUEUE_OPTION, $remaining, false);
        if (!wp_next_scheduled(GOMA_GHD_QUEUE_HOOK)) wp_schedule_single_event(time() + GOMA_GHD_RETRY_DELAY, GOMA_GHD_QUEUE_HOOK);
        goma_ghd_log('Nouvelle tentative programmée pour ' . count($remaining) . ' article(s).', false);
    }
}
add_action(GOMA_GHD_QUEUE_HOOK, 'goma_ghd_dispatch_pending_posts');

function goma_ghd_post_types() {
    $settings = goma_ghd_settings();
    $types = array_map('sanitize_key', preg_split('/[,\s]+/', (string) $settings['post_types'], -1, PREG_SPLIT_NO_EMPTY));
    return $types ? $types : array('post');
}

function goma_ghd_on_publish($new_status, $old_status, $post) {
    if ('publish' !== $new_status || 'publish' === $old_status || wp_is_post_revision($post->ID)) {
        return;
    }
    if (!in_array($post->post_type, goma_ghd_post_types(), true)) {
        return;
    }
    $pending = (array) get_option(GOMA_GHD_QUEUE_OPTION, array());
    $pending[] = $post->ID;
    update_option(GOMA_GHD_QUEUE_OPTION, array_values(array_unique(array_map('absint', $pending))), false);
    if (!wp_next_scheduled(GOMA_GHD_QUEUE_HOOK)) {
        wp_schedule_single_event(time() + 2 * MINUTE_IN_SECONDS, GOMA_GHD_QUEUE_HOOK);
    }
}
add_action('transition_post_status', 'goma_ghd_on_publish', 10, 3);

function goma_ghd_admin_menu() {
    add_options_page(
        'Notifications FCM',
        'Notifications FCM',
        'manage_options',
        'goma-github-dispatch',
        'goma_ghd_settings_page'
    );
}
add_action('admin_menu', 'goma_ghd_admin_menu');

function goma_ghd_admin_init() {
    register_setting('goma_ghd_settings_group', GOMA_GHD_OPTION, array(
        'sanitize_callback' => 'goma_ghd_sanitize_settings',
    ));
}
add_action('admin_init', 'goma_ghd_admin_init');

function goma_ghd_sanitize_settings($input) {
    $old = goma_ghd_settings();
    $service_account_json = isset($input['service_account_json']) ? trim((string) $input['service_account_json']) : '';
    return array(
        'enabled' => !empty($input['enabled']) ? 1 : 0,
        'service_account_json' => $service_account_json !== '' ? $service_account_json : $old['service_account_json'],
        'database_url' => esc_url_raw($input['database_url'] ?? $old['database_url']),
        'project_id' => sanitize_text_field($input['project_id'] ?? $old['project_id']),
        'app_url' => esc_url_raw($input['app_url'] ?? $old['app_url']),
        'tokens_path' => sanitize_text_field($input['tokens_path'] ?? $old['tokens_path']),
        'article_path' => sanitize_text_field($input['article_path'] ?? $old['article_path']),
        'notification_title' => sanitize_text_field($input['notification_title'] ?? $old['notification_title']),
        'post_types' => sanitize_text_field($input['post_types'] ?? 'post'),
    );
}

function goma_ghd_admin_notice($message, $success = true) {
    printf(
        '<div class="notice notice-%1$s is-dismissible"><p>%2$s</p></div>',
        $success ? 'success' : 'error',
        esc_html($message)
    );
}

function goma_ghd_handle_actions() {
    if (!current_user_can('manage_options') || empty($_POST['goma_ghd_action'])) {
        return;
    }
    check_admin_referer(GOMA_GHD_NONCE);
    $action = sanitize_key(wp_unslash($_POST['goma_ghd_action']));
    $settings = goma_ghd_settings();

    if ('test' === $action) {
        if (!goma_ghd_valid_settings($settings)) {
            add_settings_error('goma_ghd', 'invalid', 'Enregistre d’abord les identifiants Firebase.', 'error');
            return;
        }
        if (goma_ghd_dispatch(0, true)) {
            add_settings_error('goma_ghd', 'test', 'Notification de test envoyée à FCM.', 'updated');
        } else {
            add_settings_error('goma_ghd', 'test', 'Échec de l’envoi de test. Consulte le journal ci-dessous.', 'error');
        }
    }
}

function goma_ghd_settings_page() {
    if (!current_user_can('manage_options')) {
        return;
    }
    goma_ghd_handle_actions();
    $settings = goma_ghd_settings();
    $log = (array) get_option(GOMA_GHD_LOG_OPTION, array());
    ?>
    <div class="wrap">
        <h1>Notifications FCM</h1>
        <?php settings_errors('goma_ghd'); ?>
        <p>Envoie directement une notification Firebase Cloud Messaging lorsqu’un contenu passe au statut « Publié ».</p>
        <h2>Configuration Firebase</h2>
        <p>Dans Firebase Console, crée un compte de service et colle ici le contenu JSON téléchargé. Il reste stocké côté serveur WordPress.</p>
        <form method="post" action="options.php">
            <?php settings_fields('goma_ghd_settings_group'); ?>
            <table class="form-table" role="presentation">
                <tr><th scope="row"><label for="goma-ghd-service-account">Compte de service Firebase JSON</label></th><td><textarea id="goma-ghd-service-account" class="large-text code" rows="8" name="<?php echo esc_attr(GOMA_GHD_OPTION); ?>[service_account_json]" placeholder="Colle le JSON du compte de service"><?php echo esc_textarea($settings['service_account_json']); ?></textarea></td></tr>
                <tr><th scope="row"><label for="goma-ghd-project">ID du projet Firebase</label></th><td><input id="goma-ghd-project" class="regular-text" type="text" name="<?php echo esc_attr(GOMA_GHD_OPTION); ?>[project_id]" value="<?php echo esc_attr($settings['project_id']); ?>" required></td></tr>
                <tr><th scope="row"><label for="goma-ghd-database">URL Realtime Database</label></th><td><input id="goma-ghd-database" class="large-text" type="url" name="<?php echo esc_attr(GOMA_GHD_OPTION); ?>[database_url]" value="<?php echo esc_attr($settings['database_url']); ?>" required></td></tr>
                <tr><th scope="row"><label for="goma-ghd-app-url">URL de l’application</label></th><td><input id="goma-ghd-app-url" class="large-text" type="url" name="<?php echo esc_attr(GOMA_GHD_OPTION); ?>[app_url]" value="<?php echo esc_attr($settings['app_url']); ?>" required></td></tr>
                <tr><th scope="row"><label for="goma-ghd-tokens-path">Chemin des tokens</label></th><td><input id="goma-ghd-tokens-path" class="regular-text code" type="text" name="<?php echo esc_attr(GOMA_GHD_OPTION); ?>[tokens_path]" value="<?php echo esc_attr($settings['tokens_path']); ?>" required><p class="description">Exemple : fcmTokens</p></td></tr>
                <tr><th scope="row"><label for="goma-ghd-article-path">Chemin des articles</label></th><td><input id="goma-ghd-article-path" class="regular-text code" type="text" name="<?php echo esc_attr(GOMA_GHD_OPTION); ?>[article_path]" value="<?php echo esc_attr($settings['article_path']); ?>" required><p class="description">Utilise {slug}, par exemple : articles/{slug}</p></td></tr>
                <tr><th scope="row"><label for="goma-ghd-notification-title">Titre de notification</label></th><td><input id="goma-ghd-notification-title" class="regular-text" type="text" name="<?php echo esc_attr(GOMA_GHD_OPTION); ?>[notification_title]" value="<?php echo esc_attr($settings['notification_title']); ?>" required></td></tr>
                <tr><th scope="row">Activer l’envoi</th><td><label><input type="checkbox" name="<?php echo esc_attr(GOMA_GHD_OPTION); ?>[enabled]" value="1" <?php checked($settings['enabled'], 1); ?>> Envoyer automatiquement à la publication</label></td></tr>
                <tr><th scope="row"><label for="goma-ghd-post-types">Types de contenu</label></th><td><input id="goma-ghd-post-types" class="regular-text" type="text" name="<?php echo esc_attr(GOMA_GHD_OPTION); ?>[post_types]" value="<?php echo esc_attr($settings['post_types']); ?>" placeholder="post"><p class="description">Sépare plusieurs types par des virgules, par exemple : post,news.</p></td></tr>
            </table>
            <?php submit_button('Enregistrer les réglages'); ?>
        </form>
        <hr>
        <h2>Tests</h2>
        <form method="post" style="display:inline-block;">
            <?php wp_nonce_field(GOMA_GHD_NONCE); ?><input type="hidden" name="goma_ghd_action" value="test"><?php submit_button('Envoyer un événement de test', 'secondary', 'submit', false); ?>
        </form>
        <h2>Journal récent</h2>
        <?php if (!$log) : ?><p>Aucun événement enregistré.</p><?php else : ?><table class="widefat striped"><thead><tr><th>Date</th><th>Résultat</th><th>Détail</th></tr></thead><tbody><?php foreach ($log as $entry) : ?><tr><td><?php echo esc_html($entry['time']); ?></td><td><?php echo !empty($entry['success']) ? 'OK' : 'Erreur'; ?></td><td><?php echo esc_html($entry['message']); ?></td></tr><?php endforeach; ?></tbody></table><?php endif; ?>
    </div>
    <?php
}
