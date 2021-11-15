// Standardizes names for the indexedDB object
const indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB;

let db;

// Tells indexedDb to open (or create) whatever database you want to work with
const request = indexedDB.open("budgettracker", 1);

// Sets up the object store
request.onupgradeneeded = ({ target }) => {
  let db = target.result;
  db.createObjectStore("pending", { autoIncrement: true });
};


// If the request was successful it means the Internet is back up, so we can query the real database.
request.onsuccess = ({ target }) => {
  db = target.result;
  // checks if app is online before reading from db
  if (navigator.onLine) {
    checkDatabase();
  }
};

// Error handler
request.onerror = function(event) {
  console.log("Woops! " + event.target.errorCode);
};

// Called when it's time to save data to the indexedDb
function saveRecord(record) {
  const transaction = db.transaction(["pending"], "readwrite");
  const store = transaction.objectStore("pending");
  store.add(record);
}

// Runs when we detect that the internet connection is working again. It sends a post request to the server with all the saved data so that the data can be synced with the server, and then it wipes out the existing indexedDb.
function checkDatabase() {
  const transaction = db.transaction(["pending"], "readwrite");
  const store = transaction.objectStore("pending");
  const getAll = store.getAll();

  getAll.onsuccess = function() {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
      .then(response => {        
        return response.json();
      })
      .then(() => {
        // deletes records if successful
        const transaction = db.transaction(["pending"], "readwrite");
        const store = transaction.objectStore("pending");
        store.clear();
      });
    }
  };
}

// listens for app coming back online
window.addEventListener("online", checkDatabase);