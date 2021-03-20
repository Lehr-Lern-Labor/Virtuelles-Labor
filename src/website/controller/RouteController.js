const fileUpload = require('express-fileupload');
const expressSession = require('express-session');
const MemoryStore = require('memorystore')(expressSession);
const bodyParser = require('body-parser');
const AccountService = require('../services/AccountService');
const SlotService = require('../services/SlotService')
const path = require('path');
const Settings = require('../../game/app/server/utils/Settings');
const TypeChecker = require('../../game/app/client/shared/TypeChecker');
const dbClient = require('../../config/db');
const blobClient = require('../../config/blob');
const UAParser = require('ua-parser-js');

/**
 * The Route Controller
 * @module RouteController
 * 
 * @author Eric Ritte, Klaudia Leo, Laura Traub, Niklas Schmidt, Philipp Schumacher
 * @version 1.0.0
 */
module.exports = class RouteController {

    #app;
    #io;
    #db;
    #blob;

    /**
     * Creates an instance of RouteController
     * @constructor module:RouteController
     * 
     * @param {Express} app Express server
     * @param {SocketIO} io Socket.io instance
     * @param {dbClient} db db instance
     * @param {blobClient || undefined} blob blob instance if video storage is required, otherwise undefined
     */
    constructor(app, io, db, blob) {
        if (!!RouteController.instance) {
            return RouteController.instance;
        }

        RouteController.instance = this;

        TypeChecker.isInstanceOf(db, dbClient);

        if (Settings.VIDEOSTORAGE_ACTIVATED)
            TypeChecker.isInstanceOf(blob, blobClient);

        this.#app = app;
        this.#io = io;
        this.#db = db;
        this.#blob = blob;
        this.#init();
    }

    /**
     * @private Initialize the GET and POST methods. 
     * On receiving a GET request, the express server will render the corresponding ejs file.
     * On receiving a POST request, this will call the corresponding service method and
     * the express server will render the appropriate views depending on the failure/success status.
     * @method module:RouteController#init
     */
    #init = function () {

        /* Only needed when video storage is required for this conference */
        if (Settings.VIDEOSTORAGE_ACTIVATED) {
            //creates video container in blob storage at the beginning as we will need it to store lecture videos
            SlotService.createVideoContainer(this.#blob);
        }

        var username, title, forename, surname, job, company, email;

        //sets the view engine to ejs, ejs is required to render templates
        this.#app.set('view engine', 'ejs');

        //sets the views directory for rendering the ejs templates
        this.#app.set('views', path.join(__dirname, '../views/ejs'));

        this.#app.use(bodyParser.urlencoded({ extended: true }));
        this.#app.use(bodyParser.json());

        /* Only needed when video storage is required for this conference */
        if (Settings.VIDEOSTORAGE_ACTIVATED) {
            this.#app.use(fileUpload({
                useTempFiles: true,
                tempFileDir: '/tmp/'
            }));
        }

        var sessionMiddleware = expressSession({
            secret: 'secret',
            store: new MemoryStore({
                checkPeriod: 86400000 // prune expired entries every 24h
            }),
            resave: true,
            saveUninitialized: true
        });

        //Allows to access the session from the server side
        this.#io.use(function (socket, next) {
            sessionMiddleware(socket.request, socket.request.res || {}, next)
        });

        this.#app.use(sessionMiddleware);

        this.#app.get('/', (request, response) => {
            if (request.session.loggedin === true) {
                username = request.session.username;
                response.render('home', { videoStorageActivated: Settings.VIDEOSTORAGE_ACTIVATED, loggedIn: true, username: username });
            } else {
                response.render('home');
            }
        });

        this.#app.get('/about-us', (request, response) => {
            if (request.session.loggedin === true) {
                username = request.session.username;
                response.render('about-us', { videoStorageActivated: Settings.VIDEOSTORAGE_ACTIVATED, loggedIn: true, username: username });
            } else {
                response.render('about-us');
            }
        });

        this.#app.get('/tutorial', (request, response) => {
            if (request.session.loggedin === true) {
                username = request.session.username;
                response.render('tutorial', { videoStorageActivated: Settings.VIDEOSTORAGE_ACTIVATED, loggedIn: true, username: username });
            } else {
                response.render('tutorial');
            }
        });

        this.#app.get('/contact-us', (request, response) => {
            if (request.session.loggedin === true) {
                username = request.session.username;
                response.render('contact-us', { videoStorageActivated: Settings.VIDEOSTORAGE_ACTIVATED, loggedIn: true, username: username });
            } else {
                response.render('contact-us');
            }
        });

        this.#app.get('/privacy-policy', (request, response) => {
            if (request.session.loggedin === true) {
                username = request.session.username;
                response.render('privacy-policy', { videoStorageActivated: Settings.VIDEOSTORAGE_ACTIVATED, loggedIn: true, username: username });
            } else {
                response.render('privacy-policy');
            }
        });

        /* Only needed when video storage is required for this conference */
        if (Settings.VIDEOSTORAGE_ACTIVATED) {
            this.#app.get('/upload', (request, response) => {
                if (request.session.loggedin === true) {
                    response.render('upload', { loggedIn: true, username: username, videoStorageActivated: Settings.VIDEOSTORAGE_ACTIVATED });
                } else {
                    response.redirect('/');
                }
            });


            this.#app.post('/upload', (request, response) => {
                if (!request.files || Object.keys(request.files).length === 0) {
                    return response.render('upload', { noFilesUploaded: true, loggedIn: true, username: username, videoStorageActivated: Settings.VIDEOSTORAGE_ACTIVATED });
                }

                var maxParticipants = parseInt(request.body.maxParticipants);
                if (maxParticipants % 1 !== 0 || !(isFinite(maxParticipants))) {
                    return response.render('upload', { notInt: true, loggedIn: true, username: username, videoStorageActivated: Settings.VIDEOSTORAGE_ACTIVATED });
                }

                var startingTime = new Date(request.body.startingTime);
                if (startingTime == "Invalid Date") {
                    return response.render('upload', { notDate: true, loggedIn: true, username: username, videoStorageActivated: Settings.VIDEOSTORAGE_ACTIVATED });
                }

                var lectureTitle = request.body.title;
                var remarks = request.body.remarks;
                var oratorId = request.session.accountId;
                var video = request.files.video;

                if (path.parse(video.name).ext === '.mp4') {
                    if (video.size > 50 * 1024 * 1024) {
                        return response.render('upload', { fileSizeExceeded: true, loggedIn: true, username: username, videoStorageActivated: Settings.VIDEOSTORAGE_ACTIVATED });
                    }
                    else {
                        response.render('upload', { uploading: true, loggedIn: true, username: username, videoStorageActivated: Settings.VIDEOSTORAGE_ACTIVATED })
                        return SlotService.storeVideo(video, this.#blob).then(videoData => {
                            if (videoData) {
                                return SlotService.createSlot(videoData.fileId, videoData.duration, Settings.CONFERENCE_ID, lectureTitle, remarks, startingTime, oratorId, maxParticipants, this.#db).then(res => {
                                    response.end();
                                }).catch(err => {
                                    console.error(err);
                                })
                            }
                        }).catch(err => {
                            console.error(err);
                        })
                    }
                } else {
                    return response.render('upload', { unsupportedFileType: true, loggedIn: true, username: username, videoStorageActivated: Settings.VIDEOSTORAGE_ACTIVATED });
                }
            });
        }

        this.#app.get('/login', (request, response) => {
            if (request.session.loggedin === true) {
                response.redirect('/');
            } else {
                response.render('login');
            }

        });

        this.#app.get('/game', (request, response) => {
            if (request.session.loggedin === true) {

                const ServerController = require('../../game/app/server/controller/ServerController');
                new ServerController(this.#io, this.#db, this.#blob);
                response.sendFile(path.join(__dirname + '../../../game/app/client/views/html/canvas.html'));

            } else {
                response.redirect('/');
            }
        })

        this.#app.post('/login', (request, response) => {
            username = request.body.username;
            var password = request.body.password;

            return AccountService.verifyLoginData(username, password, '', this.#db).then(user => {

                if (user) {
                    request.session.loggedin = true;
                    request.session.accountId = user.getAccountID();
                    request.session.username = username;
                    request.session.title = user.getTitle();
                    request.session.surname = user.getSurname();
                    request.session.forename = user.getForename();
                    request.session.job = user.getJob();
                    request.session.company = user.getCompany();
                    request.session.email = user.getEmail();
                    response.redirect('/');
                }
                else {
                    return response.render('login', { wrongLoginData: true });
                }
                response.end();
            }).catch(err => {
                console.error(err);
                return response.render('login', { verifyDataFailed: true });
            })
        });

        this.#app.get('/register', (request, response) => {
            if (request.session.loggedin === true) {
                response.redirect('/');
            } else {
                response.render('register');
            }
        });

        this.#app.post('/register', (request, response) => {
            const usernameRegex = /^(?=[a-zA-Z0-9._-]{1,10}$)(?!.*[_.-]{2})[^_.-].*[^_.-]$/;

            if (!usernameRegex.test(request.body.username)) {
                return response.render('register', { invalidUsernameString: true });
            }

            username = request.body.username;
            email = request.body.email;

            const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            if (!emailRegex.test(String(email).toLowerCase())) {
                return response.render('register', { invalidEmail: true });
            }

            return AccountService.isUsernameValid(username, '', this.#db).then(res => {
                if (res) {
                    email = request.body.email;
                    return AccountService.isEmailValid(email, '', this.#db).then(res => {
                        if (res) {
                            title = request.body.title;

                            if (title === "Title") {
                                title = "";
                            }
                            else if (title !== "Mr." && title !== "Mrs." && title !== "Ms." && title !== "Dr." && title !== "Rev." && title !== "Miss" && title !== "Prof.") {
                                return response.render('register', { invalidTitle: true });
                            }

                            surname = request.body.surname;
                            forename = request.body.forename;
                            job = request.body.job;
                            company = request.body.company;
                            var password = request.body.password;

                            return AccountService.createAccount(username, title, surname, forename, job, company, email, password, '', this.#db).then(res => {
                                if (res) {
                                    request.session.accountId = res.getAccountID();
                                    request.session.registerValid = false;
                                    request.session.loggedin = true;
                                    request.session.title = res.getTitle();
                                    request.session.surname = res.getSurname();
                                    request.session.forename = res.getForename();

                                    //Needed for creating business card during entering the conference.
                                    request.session.username = res.getUsername();
                                    request.session.job = res.getJob();
                                    request.session.company = res.getCompany();
                                    request.session.email = res.getEmail();
                                }

                                response.redirect('/');
                                response.end();
                            }).catch(err => {
                                console.error(err);
                                return response.render('register', { registerFailed: true });
                            })
                        }
                        else {
                            return response.render('register', { emailTaken: true })
                        }
                    }).catch(err => {
                        console.error(err);
                        return response.render('register', { verifyDataFailed: true })
                    })
                }
                else {
                    return response.render('register', { usernameTaken: true });
                }
            }).catch(err => {
                console.error(err);
                return response.render('register', { verifyDataFailed: true })
            })
        });

        this.#app.get('/logout', (request, response) => {
            request.session.destroy();
            response.redirect('/');
        });

        this.#app.get('/editAccount', (request, response) => {
            if (request.session.loggedin === true) {
                title = request.session.title;
                forename = request.session.forename;
                surname = request.session.surname;
                job = request.session.job;
                company = request.session.company;
                email = request.session.email;
                response.render('editAccount', { loggedIn: true, username: username, email: email, title: title, forename: forename, surname: surname, job: job, company: company, videoStorageActivated: Settings.VIDEOSTORAGE_ACTIVATED })
            }
            else {
                response.redirect('/');
            }
        })

        this.#app.post('/saveAccountChanges', (request, response) => {
            title = request.body.title;

            if (title === "Title") {
                title = "";
            }
            else if (title !== "Mr." && title !== "Mrs." && title !== "Ms." && title !== "Dr." && title !== "Rev." && title !== "Miss" && title !== "Prof.") {
                return response.render('editAccount', { invalidTitle: true, loggedIn: true, videoStorageActivated: Settings.VIDEOSTORAGE_ACTIVATED, username: username, email: email, title: title, forename: forename, surname: surname, job: job, company: company });
            }

            surname = request.body.surname;
            forename = request.body.forename;
            job = request.body.job;
            company = request.body.company;
            var accountId = request.session.accountId;
            username = request.session.username;
            email = request.session.email;

            return AccountService.updateAccountData(accountId, username, title, surname, forename, job, company, email, '', this.#db).then(res => {
                request.session.accountId = res.getAccountID();
                request.session.title = res.getTitle();
                request.session.surname = res.getSurname();
                request.session.forename = res.getForename();
                request.session.username = res.getUsername();
                request.session.job = res.getJob();
                request.session.company = res.getCompany();
                request.session.email = res.getEmail();
                response.redirect('/');
            }).catch(err => {
                console.error(err);
                return response.render('editAccount', { editAccountFailed: true, loggedIn: true, videoStorageActivated: Settings.VIDEOSTORAGE_ACTIVATED, username: username, email: email, title: title, forename: forename, surname: surname, job: job, company: company });
            })
        })

        this.#app.get('*', (request, response) => {
            if (request.session.loggedin === true) {
                username = request.session.username;
                response.render('page-not-found', { videoStorageActivated: Settings.VIDEOSTORAGE_ACTIVATED, loggedIn: true, username: username });
            } else {
                response.render('page-not-found');
            }
        });
    }
}