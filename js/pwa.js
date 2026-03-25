(() => {
    const installState = {
        deferredPrompt: null
    };

    function registerServiceWorker() {
        if (!('serviceWorker' in navigator)) return;
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('service-worker.js').catch((err) => {
                console.error('No se pudo registrar el service worker:', err);
            });
        });
    }

    function exposeInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (event) => {
            event.preventDefault();
            installState.deferredPrompt = event;
            window.dispatchEvent(new CustomEvent('chiller:pwa-install-available'));
        });

        window.addEventListener('appinstalled', () => {
            installState.deferredPrompt = null;
            window.dispatchEvent(new CustomEvent('chiller:pwa-installed'));
        });

        window.promptPwaInstall = async () => {
            if (!installState.deferredPrompt) return false;
            installState.deferredPrompt.prompt();
            const choice = await installState.deferredPrompt.userChoice;
            installState.deferredPrompt = null;
            return choice?.outcome === 'accepted';
        };
    }

    registerServiceWorker();
    exposeInstallPrompt();
})();
