const bcrypt = require("bcryptjs");

const plainTextPassword = "";

bcrypt.genSalt(10, (err, salt) => {
  if (err) {
    console.error(err);
    return;
  }

  bcrypt.hash(plainTextPassword, salt, (err, hash) => {
    if (err) {
      console.error(err);
      return;
    }

    console.log("Hashed password:", hash);
  });
});
