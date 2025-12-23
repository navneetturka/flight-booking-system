function validatePassword(password) {
	const errors = [];
	
	if (password.length < 8) {
		errors.push("Password must be at least 8 characters long");
	}
	if (!/[A-Z]/.test(password)) {
		errors.push("Password must contain at least one uppercase letter");
	}
	if (!/[a-z]/.test(password)) {
		errors.push("Password must contain at least one lowercase letter");
	}
	if (!/[0-9]/.test(password)) {
		errors.push("Password must contain at least one number");
	}
	if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
		errors.push("Password must contain at least one special character");
	}
	
	return {
		isValid: errors.length === 0,
		errors
	};
}

function validateEmail(email) {
	const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return re.test(email);
}

function validatePhone(phone) {
	const re = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
	return re.test(phone.replace(/\s/g, ''));
}

module.exports = { validatePassword, validateEmail, validatePhone };

