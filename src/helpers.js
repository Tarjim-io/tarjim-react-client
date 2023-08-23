/*
 *
 */
export function isJson(str) {
	try {
		let value = JSON.parse(str);
		return value
	} catch (e) {
		return str;
	}
}

/**
 *
 */
export function isEmpty(variable) {

	if (variable === false) {
		return true;
	}

	if (Array.isArray(variable)) {
		return variable.length === 0;
	}

	if (variable === undefined || variable === null) {
		return true;
	}

	if (typeof variable === 'string' && variable.trim() === '') {
		return true;
	}

	if (typeof variable === 'object') {
		return (Object.entries(variable).length === 0 &&
			!(variable instanceof Date));
	}

	return false;
}
