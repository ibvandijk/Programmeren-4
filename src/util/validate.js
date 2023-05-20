

function validatePassword(password) {
    // regex sourced from: https://stackoverflow.com/questions/19605150/regex-for-password-must-contain-at-least-eight-characters-at-least-one-number-a
    const regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/;
    return regex.test(password);
}
function validateEmailAdress(emailAdress) {
    // regex sourced from: https://www.regexlib.com/REDetails.aspx?regexp_id=26
    const regex = /^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/i;
    return regex.test(emailAdress);
}
function validatePhoneNumber(phoneNumber) {
    const regex = /^\d{10}$/;
    return regex.test(phoneNumber);
}

module.exports = {
    validatePassword,
    validateEmailAdress,
    validatePhoneNumber,
}