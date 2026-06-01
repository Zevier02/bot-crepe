/**
 * Convertit une date en format YYYY-MM-DD-HH.
 * 
 * @param {Date} La date à convertir.
 * @returns {String} Date - La date en format YYYY-MM-DD-HH.
 */
function dateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");

    return `${year}-${month}-${day}-${hour}`;
}

module.exports = {
    dateKey
}