<?php
/**
 * Plugin Name: GOMA - GitHub Article Notifications
 * Description: Déclenche un événement GitHub lors de la publication d'un contenu WordPress.
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

function goma_ghd_defaults() {
    return array(
        'enabled' => 1,
        'owner' => '',
        'repository' => '',
        'token' => '',
        'event_type' => 'article_published',
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

function goma_ghd_api_url($path = '') {
    return 'https://api.github.com/repos/' . rawurlencode(goma_ghd_settings()['owner']) . '/' . rawurlencode(goma_ghd_settings()['repository']) . $path;
}

function goma_ghd_headers() {
    $settings = goma_ghd_settings();
    return array(
        'Accept' => 'application/vnd.github+json',
        'Authorization' => 'Bearer ' . $settings['token'],
        'X-GitHub-Api-Version' => '2022-11-28',
        'User-Agent' => 'GOMA-GitHub-Article-Notifications',
        'Content-Type' => 'application/json',
    );
}

function goma_ghd_valid_settings($settings) {
    return !empty($settings['owner']) && !empty($settings['repository']) && !empty($settings['token']) && !empty($settings['event_type']);
}

function goma_ghd_dispatch($post_id, $is_test = false) {
    $settings = goma_ghd_settings();
    if (!$settings['enabled'] && !$is_test) {
        return false;
    }
    if (!goma_ghd_valid_settings($settings)) {
        goma_ghd_log('Configuration GitHub incomplète.', false);
        return false;
    }

    $post = get_post($post_id);
    if (!$post) {
        goma_ghd_log('Contenu introuvable pour l\'ID ' . $post_id . '.', false);
        return false;
    }

    $image = get_the_post_thumbnail_url($post_id, 'full');
    $payload = array(
        'article_id' => (string) $post->ID,
        'post_id' => (string) $post->ID,
        'post_type' => (string) $post->post_type,
        'slug' => (string) $post->post_name,
        'title' => wp_strip_all_tags(get_the_title($post_id)),
        'url' => get_permalink($post_id),
        'image' => $image ? esc_url_raw($image) : '',
        'published_at' => get_post_time('c', true, $post),
        'site_url' => home_url('/'),
        'test' => (bool) $is_test,
    );

    $response = wp_remote_post(goma_ghd_api_url('/dispatches'), array(
        'timeout' => 20,
        'headers' => goma_ghd_headers(),
        'body' => wp_json_encode(array(
            'event_type' => sanitize_key($settings['event_type']),
            'client_payload' => $payload,
        )),
    ));

    if (is_wp_error($response)) {
        goma_ghd_log('Erreur réseau : ' . $response->get_error_message(), false);
        return false;
    }

    $status = wp_remote_retrieve_response_code($response);
    if ($status < 200 || $status >= 300) {
        goma_ghd_log('GitHub a répondu avec le code ' . $status . '.', false);
        return false;
    }

    goma_ghd_log(($is_test ? 'Test envoyé' : 'Notification envoyée') . ' pour le contenu ' . $post_id . '.');
    return true;
}

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
    goma_ghd_dispatch($post->ID);
}
add_action('transition_post_status', 'goma_ghd_on_publish', 10, 3);

function goma_ghd_admin_menu() {
    add_options_page(
        'Notifications GitHub',
        'Notifications GitHub',
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
    $token = isset($input['token']) ? trim((string) $input['token']) : '';
    return array(
        'enabled' => !empty($input['enabled']) ? 1 : 0,
        'owner' => sanitize_user($input['owner'] ?? '', true),
        'repository' => sanitize_text_field($input['repository'] ?? ''),
        'token' => $token !== '' ? sanitize_text_field($token) : $old['token'],
        'event_type' => sanitize_key($input['event_type'] ?? 'article_published'),
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

    if (!goma_ghd_valid_settings($settings)) {
        add_settings_error('goma_ghd', 'invalid', 'Enregistre d’abord tous les champs GitHub.', 'error');
        return;
    }

    if ('connection' === $action) {
        $response = wp_remote_get(goma_ghd_api_url(), array('timeout' => 15, 'headers' => goma_ghd_headers()));
        if (is_wp_error($response)) {
            add_settings_error('goma_ghd', 'connection', $response->get_error_message(), 'error');
            return;
        }
        $status = wp_remote_retrieve_response_code($response);
        add_settings_error('goma_ghd', 'connection', 200 === $status ? 'Connexion GitHub réussie.' : 'GitHub a répondu avec le code ' . $status . '.', 200 === $status ? 'updated' : 'error');
    }

    if ('test' === $action) {
        if (goma_ghd_dispatch(get_posts(array('post_type' => 'post', 'post_status' => 'publish', 'numberposts' => 1))[0]->ID ?? 0, true)) {
            add_settings_error('goma_ghd', 'test', 'Événement de test envoyé à GitHub.', 'updated');
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
    settings_errors('goma_ghd');
    $settings = goma_ghd_settings();
    $log = (array) get_option(GOMA_GHD_LOG_OPTION, array());
    ?>
    <div class="wrap">
        <h1>Notifications GitHub</h1>
        <p>Envoie un événement GitHub lorsqu’un contenu passe au statut « Publié ».</p>
        <form method="post" action="options.php">
            <?php settings_fields('goma_ghd_settings_group'); ?>
            <table class="form-table" role="presentation">
                <tr><th scope="row">Activer l’envoi</th><td><label><input type="checkbox" name="<?php echo esc_attr(GOMA_GHD_OPTION); ?>[enabled]" value="1" <?php checked($settings['enabled'], 1); ?>> Envoyer automatiquement à la publication</label></td></tr>
                <tr><th scope="row"><label for="goma-ghd-owner">Propriétaire GitHub</label></th><td><input id="goma-ghd-owner" class="regular-text" type="text" name="<?php echo esc_attr(GOMA_GHD_OPTION); ?>[owner]" value="<?php echo esc_attr($settings['owner']); ?>" placeholder="oredytech" required><p class="description">Nom du compte ou de l’organisation GitHub.</p></td></tr>
                <tr><th scope="row"><label for="goma-ghd-repository">Dépôt GitHub</label></th><td><input id="goma-ghd-repository" class="regular-text" type="text" name="<?php echo esc_attr(GOMA_GHD_OPTION); ?>[repository]" value="<?php echo esc_attr($settings['repository']); ?>" placeholder="GOMA-WEBRADIO-APPLICATION-MOBILE" required></td></tr>
                <tr><th scope="row"><label for="goma-ghd-token">Token GitHub</label></th><td><input id="goma-ghd-token" class="large-text" type="password" name="<?php echo esc_attr(GOMA_GHD_OPTION); ?>[token]" value="" placeholder="Laisser vide pour conserver le token actuel"><p class="description">Token fine-grained avec accès au dépôt et permission « Contents: Read and write ». Il est stocké dans les options privées WordPress.</p></td></tr>
                <tr><th scope="row"><label for="goma-ghd-event">Type d’événement</label></th><td><input id="goma-ghd-event" class="regular-text" type="text" name="<?php echo esc_attr(GOMA_GHD_OPTION); ?>[event_type]" value="<?php echo esc_attr($settings['event_type']); ?>" placeholder="article_published" required></td></tr>
                <tr><th scope="row"><label for="goma-ghd-post-types">Types de contenu</label></th><td><input id="goma-ghd-post-types" class="regular-text" type="text" name="<?php echo esc_attr(GOMA_GHD_OPTION); ?>[post_types]" value="<?php echo esc_attr($settings['post_types']); ?>" placeholder="post"><p class="description">Sépare plusieurs types par des virgules, par exemple : post,news.</p></td></tr>
            </table>
            <?php submit_button('Enregistrer les réglages'); ?>
        </form>
        <hr>
        <h2>Tests</h2>
        <form method="post" style="display:inline-block;margin-right:8px;">
            <?php wp_nonce_field(GOMA_GHD_NONCE); ?><input type="hidden" name="goma_ghd_action" value="connection"><?php submit_button('Tester la connexion GitHub', 'secondary', 'submit', false); ?>
        </form>
        <form method="post" style="display:inline-block;">
            <?php wp_nonce_field(GOMA_GHD_NONCE); ?><input type="hidden" name="goma_ghd_action" value="test"><?php submit_button('Envoyer un événement de test', 'secondary', 'submit', false); ?>
        </form>
        <h2>Journal récent</h2>
        <?php if (!$log) : ?><p>Aucun événement enregistré.</p><?php else : ?><table class="widefat striped"><thead><tr><th>Date</th><th>Résultat</th><th>Détail</th></tr></thead><tbody><?php foreach ($log as $entry) : ?><tr><td><?php echo esc_html($entry['time']); ?></td><td><?php echo !empty($entry['success']) ? 'OK' : 'Erreur'; ?></td><td><?php echo esc_html($entry['message']); ?></td></tr><?php endforeach; ?></tbody></table><?php endif; ?>
    </div>
    <?php
}
