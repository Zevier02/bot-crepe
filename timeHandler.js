/**
 * Convertit une date en format YYYY-MM-DD-HH.
 * 
 * @param {Date} Date - La date à convertir.
 * @returns {String} Date - La date en format YYYY-MM-DD-HH.
 */
function dateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");

    return `${year}-${month}-${day}-${hour}`;
}

/**
 * Convertit une date en format dateKey (YYYY-MM-DD-HH) en nombre pour pouvoir les comparer (décimales: YYYYMMDDHH).
 * (plus récent = valeur plus élevée)
 * 
 * @param {String} dateKey - La date à convertir en format YYYY-MM-DD-HH. 
 * @returns {Number} intDate - La date convertie (décimales: YYYYMMDDHH).
 */
function intDate(dateKey) {return Number(dateKey.replaceAll("-", ""))};


/**
 * Convertit une date en format DD/MM/YYYY.
 * 
 * @param {Date} date - La date à convertir en format DD/MM/YYYY.
 * @returns {String} date - La date en DD/MM/YYYY.
 */
function formatDate(date) {
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();

    return `${d}/${m}/${y}`;
}

module.exports = {
    dateKey,
    intDate,
    formatDate
}