const TypeChecker = require('../../game/app/client/shared/TypeChecker.js');
const Account = require('../models/Account')
const ObjectId = require('mongodb').ObjectID;
const passwordHash = require('password-hash');
const db = require('../../config/db');

/**
 * The Account Service
 * @module AccountService
 * 
 * @author Eric Ritte, Klaudia Leo, Laura Traub, Niklas Schmidt, Philipp Schumacher
 * @version 1.0.0
 */
module.exports = class AccountService {

    /**
     * checks if username is valid
     * @static @method module:AccountService#isUsernameValid
     * 
     * @param {String} username username
     * @param {String} suffix collection name suffix
     * @param {db} vimsudb db instance
     * 
     * @return {boolean} true if valid, i.e. there's no user with this username found in the database, otherwise false
     */
    static isUsernameValid(username, suffix, vimsudb) {
        TypeChecker.isString(username);
        TypeChecker.isString(suffix);
        TypeChecker.isInstanceOf(vimsudb, db)

        return vimsudb.findInCollection("accounts" + suffix, { username: username }, { username: username }).then(results => {
            if (results.length > 0) {
                return false;
            }
            else {
                return true;
            }
        })
    }

    /**
     * creates a user account and saves it in the database.
     * @static @method module:AccountService#createAccount
     * 
     * @param {String} username account username
     * @param {String} forename user's forename
     * @param {String} password user's password
     * @param {String} suffix collection name suffix
     * @param {db} vimsudb db instance
     * 
     * @return {Account} Account instance
     */
    static createAccount(username, forename, password, suffix, vimsudb) {
        TypeChecker.isString(username);
        TypeChecker.isString(forename);
        TypeChecker.isString(password);
        TypeChecker.isString(suffix);
        TypeChecker.isInstanceOf(vimsudb, db);

        return this.isUsernameValid(username, suffix, vimsudb).then(res => {
            if (!res)
                return res;
            
            var accountId = new ObjectId().toString();
            var account = new Account(accountId, username, forename);
        
            var acc = {
                accountId: account.getAccountID(),
                username: account.getUsername(),
                forename: account.getForename(),
                passwordHash: passwordHash.generate(password),
                registrationTime: new Date()
            }
        
             return vimsudb.insertOneToCollection("accounts" + suffix, acc).then(res => {
                return account;
            }).catch(err => {
                console.error(err);
            })
        })
    }

    /**
     * gets account by accountID from the database
     * @static @method module:AccountService#getAccountById
     * 
     * @param {String} accountId account ID
     * @param {String} suffix collection name suffix
     * @param {db} vimsudb db instance
     * 
     * @return {Object|boolean} user data if found, otherwise false
     */
    static getAccountById(accountId, suffix, vimsudb) {
        TypeChecker.isString(accountId);
        TypeChecker.isString(suffix);
        TypeChecker.isInstanceOf(vimsudb, db);

        return vimsudb.findOneInCollection("accounts" + suffix, { accountId: accountId }, "").then(user => {
            if (user) {
                return user;
            }
            else {
                return false;
            }
        }).catch(err => {
            console.error(err);
        })

    }

    /**
     * @private gets account by account username from the database
     * @method module:AccountService#getAccountByUsername
     * 
     * @param {String} username account username
     * @param {String} suffix collection name suffix
     * @param {db} vimsudb db instance
     * 
     * @return {Object|boolean} user data if found, otherwise false
     */
    static #getAccountByUsername = function (username, suffix, vimsudb) {
        TypeChecker.isString(username);
        TypeChecker.isString(suffix);
        TypeChecker.isInstanceOf(vimsudb, db);

        return vimsudb.findOneInCollection("accounts" + suffix, { username: username }, "").then(user => {
            if (user) {
                return user;
            }
            else {
                return false;
            }
        }).catch(err => {
            console.error(err);
        })

    }

    /**
     * gets account username
     * @static @method module:AccountService#getAccountUsername
     * 
     * @param {String} accountId account ID
     * @param {String} suffix collection name suffix
     * @param {db} vimsudb db instance
     * 
     * @return {String} username
     */
    static getAccountUsername(accountId, suffix, vimsudb) {
        TypeChecker.isString(accountId);
        TypeChecker.isString(suffix);
        TypeChecker.isInstanceOf(vimsudb, db);

        return vimsudb.findOneInCollection("accounts" + suffix, { accountId: accountId }, { username: 1 }).then(user => {
            if (user) {
                return user.username;
            }
            else {
                return false;
            }
        }).catch(err => {
            console.error(err);
        })
    }

    /**
     * updates account data in the database
     * @static @method module:AccountService#updateAccountData
     * 
     * @param {String} accountId account ID
     * @param {String} username account username
     * @param {String} newForename new user forename
     * @param {String} suffix collection name suffix
     * @param {db} vimsudb db instance
     * 
     * @return {Account} Account instance
     */
    static updateAccountData(accountId, username, newForename, suffix, vimsudb) {
        TypeChecker.isString(accountId);
        TypeChecker.isString(username);
        TypeChecker.isString(newForename);
        TypeChecker.isString(suffix);
        TypeChecker.isInstanceOf(vimsudb, db);

        var account = new Account(accountId, username, newForename);

        return vimsudb.updateOneToCollection("accounts" + suffix, { accountId: accountId }, { forename: newForename }).then(res => {
            return account;
        }).catch(err => {
            console.error(err)
        });
    }

    /**
     * checks if username and password in the database matches
     * @static @method module:AccountService#verifyLoginData
     * 
     * @param {String} username account username
     * @param {String} password user's password
     * @param {String} suffix collection name suffix
     * @param {db} vimsudb db instance
     * 
     * @return {Account|boolean} Account instance if matches, otherwise false
     */
    static verifyLoginData(username, password, suffix, vimsudb) {
        TypeChecker.isString(username);
        TypeChecker.isString(password);
        TypeChecker.isString(suffix);
        TypeChecker.isInstanceOf(vimsudb, db);

        return this.#getAccountByUsername(username, suffix, vimsudb).then(user => {
            if (user && passwordHash.verify(password, user.passwordHash)) {
                var account = new Account(user.accountId, user.username, user.forename);
                return account;
            } else {
                return false;
            }
        }).catch(err => {
            console.error(err)
        })
    }

    /**
     * Deletes an account from the database
     * @static @method module:AccountService#deleteAccount
     * 
     * @param {String} accountId account ID
     * @param {String} suffix collection name suffix
     * @param {db} vimsudb db instance
     */
    static deleteAccount(accountId, suffix, vimsudb) {
        TypeChecker.isString(accountId);
        TypeChecker.isString(suffix);
        TypeChecker.isInstanceOf(vimsudb, db);

        return vimsudb.deleteOneFromCollection("accounts" + suffix, { accountId: accountId }).then(res => {
            console.log("account with accountId " + accountId + " deleted");
            return res;
        }).catch(err => {
            console.error(err);
        })

    }
} 