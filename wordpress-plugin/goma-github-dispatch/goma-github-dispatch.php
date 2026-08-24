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
const GOMA_GHD_OAUTH_NONCE = 'goma_ghd_oauth';

function goma_ghd_defaults() {
    return array(
        'enabled' => 1,
        'owner' => '',
        'repository' => '',
        'token' => '',
        'oauth_client_id' => '',
        'oauth_client_secret' => '',
        'github_user' => '',
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

function goma_ghd_oauth_redirect_uri() {
    return admin_url('options-general.php?page=goma-github-dispatch&goma_ghd_oauth=callback');
}

function goma_ghd_github_request($url, $args = array()) {
    $settings = goma_ghd_settings();
    $args = wp_parse_args($args, array('timeout' => 20, 'headers' => array()));
    $args['headers'] = array_merge(array(
        'Accept' => 'application/vnd.github+json',
        'X-GitHub-Api-Version' => '2022-11-28',
        'User-Agent' => 'GOMA-GitHub-Article-Notifications',
    ), $args['headers']);
    if (!empty($settings['token'])) {
        $args['headers']['Authorization'] = 'Bearer ' . $settings['token'];
    }
    return wp_remote_request($url, $args);
}

function goma_ghd_repositories() {
    $repositories = array();
    for ($page = 1; $page <= 10; $page++) {
        $response = goma_ghd_github_request('https://api.github.com/user/repos?per_page=100&sort=full_name&page=' . $page);
        if (is_wp_error($response) || 200 !== wp_remote_retrieve_response_code($response)) {
            return array();
        }
        $items = json_decode(wp_remote_retrieve_body($response), true);
        if (!is_array($items)) return array();
        foreach ($items as $repo) {
            if (!empty($repo['owner']['login']) && !empty($repo['name'])) {
                $repositories[] = array(
                    'full_name' => $repo['full_name'],
                    'owner' => $repo['owner']['login'],
                    'name' => $repo['name'],
                    'private' => !empty($repo['private']),
                );
            }
        }
        if (count($items) < 100) break;
    }
    return $repositories;
}

function goma_ghd_start_oauth() {
    check_admin_referer(GOMA_GHD_OAUTH_NONCE);
    $settings = goma_ghd_settings();
    if (empty($settings['oauth_client_id'])) {
        wp_safe_redirect(add_query_arg(array('goma_ghd_notice' => 'oauth_config'), admin_url('options-general.php?page=goma-github-dispatch')));
        exit;
    }
    $state = wp_generate_password(32, false, false);
    set_transient('goma_ghd_oauth_' . get_current_user_id(), $state, 10 * MINUTE_IN_SECONDS);
    $url = add_query_arg(array(
        'client_id' => $settings['oauth_client_id'],
        'redirect_uri' => goma_ghd_oauth_redirect_uri(),
        'scope' => 'repo',
        'state' => $state,
    ), 'https://github.com/login/oauth/authorize');
    wp_redirect($url);
    exit;
}

function goma_ghd_handle_oauth_callback() {
    if (!is_admin() || !current_user_can('manage_options') || empty($_GET['goma_ghd_oauth'])) return;
    if ('start' === $_GET['goma_ghd_oauth']) goma_ghd_start_oauth();
    if ('callback' !== $_GET['goma_ghd_oauth']) return;
    $state = sanitize_text_field(wp_unslash($_GET['state'] ?? ''));
    $saved_state = get_transient('goma_ghd_oauth_' . get_current_user_id());
    delete_transient('goma_ghd_oauth_' . get_current_user_id());
    if (!$state || !$saved_state || !hash_equals($saved_state, $state)) {
        wp_die('La validation GitHub a échoué. Recommence la connexion.');
    }
    if (!empty($_GET['error'])) {
        wp_safe_redirect(add_query_arg(array('goma_ghd_notice' => 'oauth_cancelled'), admin_url('options-general.php?page=goma-github-dispatch')));
        exit;
    }
    $settings = goma_ghd_settings();
    $response = wp_remote_post('https://github.com/login/oauth/access_token', array(
        'timeout' => 20,
        'headers' => array('Accept' => 'application/json'),
        'body' => array(
            'client_id' => $settings['oauth_client_id'],
            'client_secret' => $settings['oauth_client_secret'],
            'code' => sanitize_text_field(wp_unslash($_GET['code'] ?? '')),
            'redirect_uri' => goma_ghd_oauth_redirect_uri(),
        ),
    ));
    $data = json_decode(wp_remote_retrieve_body($response), true);
    if (is_wp_error($response) || empty($data['access_token'])) {
        wp_safe_redirect(add_query_arg(array('goma_ghd_notice' => 'oauth_error'), admin_url('options-general.php?page=goma-github-dispatch')));
        exit;
    }
    $settings['token'] = sanitize_text_field($data['access_token']);
    $user_response = goma_ghd_github_request('https://api.github.com/user', array('headers' => array('Authorization' => 'Bearer ' . $settings['token'])));
    $user = json_decode(wp_remote_retrieve_body($user_response), true);
    $settings['github_user'] = sanitize_text_field($user['login'] ?? '');
    update_option(GOMA_GHD_OPTION, $settings, false);
    wp_safe_redirect(add_query_arg(array('goma_ghd_notice' => 'oauth_success'), admin_url('options-general.php?page=goma-github-dispatch')));
    exit;
}
add_action('admin_init', 'goma_ghd_handle_oauth_callback', 1);

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
        'oauth_client_id' => sanitize_text_field($input['oauth_client_id'] ?? $old['oauth_client_id']),
        'oauth_client_secret' => !empty($input['oauth_client_secret']) ? sanitize_text_field($input['oauth_client_secret']) : $old['oauth_client_secret'],
        'github_user' => sanitize_text_field($old['github_user']),
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

    if ('connection' === $action) {
        if (empty($settings['token'])) {
            add_settings_error('goma_ghd', 'invalid', 'Connecte d’abord un compte GitHub.', 'error');
            return;
        }
        $response = goma_ghd_github_request('https://api.github.com/user');
        if (is_wp_error($response)) {
            add_settings_error('goma_ghd', 'connection', $response->get_error_message(), 'error');
            return;
        }
        $status = wp_remote_retrieve_response_code($response);
        add_settings_error('goma_ghd', 'connection', 200 === $status ? 'Connexion GitHub réussie.' : 'GitHub a répondu avec le code ' . $status . '.', 200 === $status ? 'updated' : 'error');
    }

    if ('test' === $action) {
        if (!goma_ghd_valid_settings($settings)) {
            add_settings_error('goma_ghd', 'invalid', 'Enregistre d’abord tous les champs GitHub et choisis un dépôt.', 'error');
            return;
        }
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
    $settings = goma_ghd_settings();
    if ('oauth_success' === ($_GET['goma_ghd_notice'] ?? '')) add_settings_error('goma_ghd', 'oauth', 'Connexion GitHub réussie. Le token OAuth est enregistré.', 'updated');
    if ('oauth_config' === ($_GET['goma_ghd_notice'] ?? '')) add_settings_error('goma_ghd', 'oauth', 'Renseigne d’abord le Client ID de ton application OAuth GitHub.', 'error');
    if ('oauth_cancelled' === ($_GET['goma_ghd_notice'] ?? '')) add_settings_error('goma_ghd', 'oauth', 'Connexion GitHub annulée.', 'error');
    if ('oauth_error' === ($_GET['goma_ghd_notice'] ?? '')) add_settings_error('goma_ghd', 'oauth', 'GitHub n’a pas pu fournir le token OAuth.', 'error');
    $repositories = !empty($settings['token']) ? goma_ghd_repositories() : array();
    $oauth_ready = !empty($settings['oauth_client_id']) && !empty($settings['oauth_client_secret']);
    $github_connected = !empty($settings['token']) && !empty($settings['github_user']);
    $log = (array) get_option(GOMA_GHD_LOG_OPTION, array());
    ?>
    <div class="wrap">
        <h1>Notifications GitHub</h1>
        <?php settings_errors('goma_ghd'); ?>
        <p>Envoie un événement GitHub lorsqu’un contenu passe au statut « Publié ».</p>
        <h2>1. Préparer la connexion GitHub</h2>
        <p>Crée une <a href="https://github.com/settings/developers" target="_blank" rel="noopener noreferrer">GitHub OAuth App</a>, puis indique ses identifiants ci-dessous. Cette étape est nécessaire avant de pouvoir cliquer sur le compte GitHub. L’URL de callback à enregistrer est :</p>
        <code><?php echo esc_html(goma_ghd_oauth_redirect_uri()); ?></code>
        <form method="post" action="options.php">
            <?php settings_fields('goma_ghd_settings_group'); ?>
            <table class="form-table" role="presentation">
                <tr><th scope="row"><label for="goma-ghd-client-id">Client ID OAuth GitHub</label></th><td><input id="goma-ghd-client-id" class="regular-text" type="text" name="<?php echo esc_attr(GOMA_GHD_OPTION); ?>[oauth_client_id]" value="<?php echo esc_attr($settings['oauth_client_id']); ?>" placeholder="Iv1.xxxxxxxxxxxxx"></td></tr>
                <tr><th scope="row"><label for="goma-ghd-client-secret">Client Secret OAuth GitHub</label></th><td><input id="goma-ghd-client-secret" class="large-text" type="password" name="<?php echo esc_attr(GOMA_GHD_OPTION); ?>[oauth_client_secret]" value="" placeholder="Laisser vide pour conserver le secret"><?php if (!empty($settings['oauth_client_secret'])) : ?><p class="description"><strong>Secret enregistré.</strong> Il est masqué pour votre sécurité. Remplissez ce champ uniquement pour le remplacer.</p><?php else : ?><p class="description">Le secret reste côté serveur WordPress.</p><?php endif; ?></td></tr>
                <tr><th scope="row">Activer l’envoi</th><td><label><input type="checkbox" name="<?php echo esc_attr(GOMA_GHD_OPTION); ?>[enabled]" value="1" <?php checked($settings['enabled'], 1); ?>> Envoyer automatiquement à la publication</label></td></tr>
                <tr><th scope="row">Compte connecté</th><td><strong><?php echo $github_connected ? 'Connecté à GitHub : ' . esc_html($settings['github_user']) : 'Aucun compte GitHub connecté'; ?></strong><br><?php if ($oauth_ready) : ?><a class="button button-primary" href="<?php echo esc_url(wp_nonce_url(admin_url('options-general.php?page=goma-github-dispatch&goma_ghd_oauth=start'), GOMA_GHD_OAUTH_NONCE)); ?>">2. <?php echo $github_connected ? 'Reconnecter le compte GitHub' : 'Se connecter à GitHub'; ?></a><?php else : ?><span class="button disabled" aria-disabled="true">2. Enregistrer d’abord les identifiants</span><?php endif; ?></td></tr>
                <tr><th scope="row"><label for="goma-ghd-repository">3. Dépôt cible</label></th><td><?php if ($repositories) : ?><select id="goma-ghd-repository" name="<?php echo esc_attr(GOMA_GHD_OPTION); ?>[repository]" required><option value="">-- Choisir un dépôt --</option><?php foreach ($repositories as $repo) : ?><option value="<?php echo esc_attr($repo['name']); ?>" data-owner="<?php echo esc_attr($repo['owner']); ?>" <?php selected($settings['owner'] . '/' . $settings['repository'], $repo['full_name']); ?>><?php echo esc_html($repo['full_name'] . ($repo['private'] ? ' (privé)' : '')); ?></option><?php endforeach; ?></select><input id="goma-ghd-owner" type="hidden" name="<?php echo esc_attr(GOMA_GHD_OPTION); ?>[owner]" value="<?php echo esc_attr($settings['owner']); ?>"><script>document.getElementById('goma-ghd-repository').addEventListener('change',function(){document.getElementById('goma-ghd-owner').value=this.options[this.selectedIndex].dataset.owner||'';});</script><?php else : ?><p>Connecte d’abord GitHub pour charger la liste des dépôts du compte.</p><select id="goma-ghd-repository" disabled><option>La liste apparaîtra après la connexion GitHub</option></select><input type="hidden" name="<?php echo esc_attr(GOMA_GHD_OPTION); ?>[owner]" value="<?php echo esc_attr($settings['owner']); ?>"><input type="hidden" name="<?php echo esc_attr(GOMA_GHD_OPTION); ?>[repository]" value="<?php echo esc_attr($settings['repository']); ?>"><?php endif; ?></td></tr>
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
