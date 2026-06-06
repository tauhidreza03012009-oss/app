if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js');
            });
        }

        // TRICK: The moment the user touches the app, force Android into true hardware immersion
        function lockImmersive() {
            const doc = document.documentElement;
            if (doc.requestFullscreen) {
                doc.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
            } else if (doc.webkitRequestFullscreen) {
                doc.webkitRequestFullscreen();
            }
        }

        // Listen for the first touch event to blast away the native bars completely
        window.addEventListener('touchstart', lockImmersive, { once: true });
        window.addEventListener('click', lockImmersive, { once: true });
