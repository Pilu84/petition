const spicedPg = require("spiced-pg");

const db = spicedPg(
    process.env.DATABASE_URL ||
        `postgres:postgres:postgres@localhost:5432/petition`
);

exports.createSign = (sing, user_id) => {
    return db.query(
        `INSERT INTO signatures ( sing, user_id)
                VALUES ($1, $2)
                RETURNING id`,

        [sing, user_id]
    );
};

exports.getSign = id => {
    return db.query(`SELECT sing FROM signatures WHERE user_id = $1`, [id]);
};

exports.getSigners = () => {
    return db.query(`SELECT first_name, last_name,
                        users_profil.age AS age, users_profil.city AS city, users_profil.url AS URL, signatures.id AS sign
                        FROM users
                        LEFT JOIN users_profil
                        ON users.id = users_profil.user_id
                        JOIN signatures
                        ON users.id = signatures.user_id
                        `);
};

exports.createUser = (first_name, last_name, email, hpass) => {
    return db.query(
        `INSERT INTO users (first_name, last_name, email, pass)
                        VALUES ($1, $2, $3, $4)
                        RETURNING id`,

        [first_name, last_name, email, hpass]
    );
};

exports.loginUser = email => {
    return db.query(`SELECT * FROM users WHERE email = $1`, [email]);
};

exports.chekForName = id => {
    return db.query(
        `SELECT first_name, last_name, signatures.id AS signature
        FROM users
        LEFT JOIN signatures
        ON users.id = signatures.user_id
        WHERE users.id = $1`,

        [id]
    );
};

exports.writeProfil = (age, city, url, user_id) => {
    return db.query(
        `INSERT INTO users_profil (age, city, url, user_id)
        VALUES ($1, $2, $3, $4)`,
        [age, city, url, user_id]
    );
};

exports.selectCity = city => {
    return db.query(
        `SELECT first_name, last_name, users.id AS ujid,
                            users_profil.age AS age, users_profil.city AS city, users_profil.url AS URL
                            FROM users
                            LEFT JOIN users_profil
                            ON users.id = users_profil.user_id
                            JOIN signatures
                            ON users.id = signatures.user_id
                            WHERE LOWER(city) = LOWER($1)`,

        [city]
    );
};

exports.getProfilData = id => {
    return db.query(
        `SELECT first_name, last_name, email,
                users_profil.age AS age, users_profil.city AS city, users_profil.url AS url
                FROM users
                LEFT JOIN users_profil
                ON users.id = users_profil.user_id
                WHERE users.id = $1`,

        [id]
    );
};

exports.updateProfilData = (id, first_name, last_name, email) => {
    return db.query(
        `UPDATE users SET first_name = $2, last_name = $3, email = $4
        WHERE id = $1`,

        [id, first_name, last_name, email]
    );
};

exports.updateUsersProfil = (id, age, city, url) => {
    return db.query(
        `INSERT INTO users_profil (age, city, url, user_id)
                    VALUES ($2, $3, $4, $1)
                    ON CONFLICT (user_id)
                    DO UPDATE SET age = $2, city = $3, url = $4`,

        [id, age, city, url]
    );
};

exports.updatePass = (id, password) => {
    return db.query(
        `UPDATE users SET pass = $2
            WHERE id = $1`,

        [id, password]
    );
};

exports.delSignatures = id => {
    return db.query(
        `DELETE FROM signatures WHERE user_id = $1`,

        [id]
    );
};

exports.delProfil = id => {
    return db.query(
        `DELETE FROM users WHERE id = $1`,

        [id]
    );
};

exports.delUserProfils = id => {
    return db.query(
        `DELETE FROM users_profil WHERE user_id = $1`,

        [id]
    );
};
