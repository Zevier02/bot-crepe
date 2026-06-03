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
 * Renvoie le nombre de messages envoyés de `fromDate` à `toDate`.
 * 
 * @param {Object} userData - Les données de l'utilisateur.
 * @param {Date} fromDate - La date de départ.
 * @param {Date} toDate - La date d'arrivée.
 * @returns {bigint} Count - Le nombre de messages envoyés.
 */
function getMessageCountFromTo(userData, fromDate, toDate = new Date()) {
    fromDate = dateKey(fromDate);
    toDate = dateKey(toDate);

    // Trier hourlyMessages du plus récent au plus acien.
    const messages = userData.messages
    
    let count = 0n
    for (const message of [...messages].reverse()) { // Parcourt hourlyMessages du plus récent au plus ancien.
        if(intDate(message.date) - intDate(fromDate) < 0) { // Si la date est avant fromDate
            break;
        }

        if(intDate(message.date) - intDate(toDate) > 0) { // Si la date est après toDate
            continue;
        }

        count += 1n;
    };

    return count;
}

module.exports = {
    dateKey,
    getMessageCountFromTo
}