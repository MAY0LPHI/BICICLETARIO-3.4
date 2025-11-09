export const Modals = {
    showConfirm(message, title = 'Confirmação') {
        return new Promise((resolve) => {
            const modal = document.getElementById('custom-confirm-modal');
            const titleEl = document.getElementById('confirm-title');
            const messageEl = document.getElementById('confirm-message');
            const okBtn = document.getElementById('confirm-ok-btn');
            const cancelBtn = document.getElementById('confirm-cancel-btn');

            titleEl.textContent = title;
            messageEl.textContent = message;

            const handleOk = () => {
                cleanup();
                resolve(true);
            };

            const handleCancel = () => {
                cleanup();
                resolve(false);
            };

            const cleanup = () => {
                modal.querySelector('.modal-content').classList.remove('scale-100');
                modal.querySelector('.modal-content').classList.add('scale-95');
                modal.classList.remove('show');
                
                setTimeout(() => {
                    modal.classList.add('hidden');
                }, 300);
                
                okBtn.removeEventListener('click', handleOk);
                cancelBtn.removeEventListener('click', handleCancel);
            };

            okBtn.addEventListener('click', handleOk);
            cancelBtn.addEventListener('click', handleCancel);

            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.add('show');
                modal.querySelector('.modal-content').classList.remove('scale-95');
                modal.querySelector('.modal-content').classList.add('scale-100');
            }, 10);
        });
    },

    showAlert(message, title = 'Aviso') {
        return new Promise((resolve) => {
            const modal = document.getElementById('custom-alert-modal');
            const titleEl = document.getElementById('alert-title');
            const messageEl = document.getElementById('alert-message');
            const okBtn = document.getElementById('alert-ok-btn');

            titleEl.textContent = title;
            messageEl.textContent = message;

            const handleOk = () => {
                cleanup();
                resolve();
            };

            const cleanup = () => {
                modal.querySelector('.modal-content').classList.remove('scale-100');
                modal.querySelector('.modal-content').classList.add('scale-95');
                modal.classList.remove('show');
                
                setTimeout(() => {
                    modal.classList.add('hidden');
                }, 300);
                
                okBtn.removeEventListener('click', handleOk);
            };

            okBtn.addEventListener('click', handleOk);

            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.add('show');
                modal.querySelector('.modal-content').classList.remove('scale-95');
                modal.querySelector('.modal-content').classList.add('scale-100');
            }, 10);
        });
    }
};
