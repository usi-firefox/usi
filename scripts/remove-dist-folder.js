const fs = require('fs');

const folderName = "dist";

// delete directory recursively
fs.rmdir(folderName, { recursive: true }, (err) => {
    if (err) {
        throw new Error(err);
    }
});