document.addEventListener('DOMContentLoaded', () => {
    const toggleNewPassword = document.getElementById('toggle-new-password');
    const toggleConfirmPassword = document.getElementById('toggle-confirm-password');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const showPassCheckbox = document.getElementById('show-pass');
    const form = document.getElementById('password-form');

    const togglePasswordVisibility = () => {
        const type = newPasswordInput.type === 'password' ? 'text' : 'password';
        newPasswordInput.type = type;
        confirmPasswordInput.type = type;
    };

    toggleNewPassword.addEventListener('click', () => {
        togglePasswordVisibility();
        toggleNewPassword.classList.toggle('bx-show');
        toggleNewPassword.classList.toggle('bx-hide');
    });

    toggleConfirmPassword.addEventListener('click', () => {
        togglePasswordVisibility();
        toggleConfirmPassword.classList.toggle('bx-show');
        toggleConfirmPassword.classList.toggle('bx-hide');
    });

    showPassCheckbox.addEventListener('change', () => {
        if (showPassCheckbox.checked) {
            newPasswordInput.type = 'text';
            confirmPasswordInput.type = 'text';
        } else {
            newPasswordInput.type = 'password';
            confirmPasswordInput.type = 'password';
        }
    });

    const validatePasswords = () => {
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (newPassword !== confirmPassword) {
            confirmPasswordInput.classList.add('error');
        } else {
            confirmPasswordInput.classList.remove('error');
        }
    };

    newPasswordInput.addEventListener('input', validatePasswords);
    confirmPasswordInput.addEventListener('input', validatePasswords);
});
