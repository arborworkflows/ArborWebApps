/*jslint browser: true */
/*globals $, btoa */

$.fn.girderLogin = function(options) {
    "use strict";
    var loginMenu = $('<a href="#">Login</a>'),
        user = $('<span></span>'),
        logoutMenu = $('<a href="#">Logout</a>'),
        loginModal = $('<div class="modal fade" tabindex="-1" id="girder-login-modal" role="dialog">'),
        loginDialog = $('<div class="modal-dialog"></div>'),
        loginContent = $('<div class="modal-content"></div>'),
        loginBody = $('<div class="modal-body"></div>'),
        loginForm = $('<form role="form"></form>'),
        loginGroup = $('<div class="form-group">'),
        login = $('<input type="text" class="form-control" placeholder="Username or email"></input>'),
        passwordGroup = $('<div class="form-group">'),
        password = $('<input type="password" class="form-control" placeholder="Password"></input>'),
        loginOrRegister = $('<span></span>'),
        loginButton = $('<button type="submit" class="btn btn-primary">Login</button>'),
        registerMenu = $('<a href="#">register</a>'),
        registerModal = $('<div class="modal fade" tabindex="-1" id="girder-login-modal" role="dialog">'),
        registerDialog = $('<div class="modal-dialog"></div>'),
        registerContent = $('<div class="modal-content"></div>'),
        registerBody = $('<div class="modal-body"></div>'),
        registerForm = $('<form role="form"></form>'),
        registerLoginGroup = $('<div class="form-group">'),
        registerLogin = $('<input type="text" class="form-control" placeholder="Username"></input>'),
        registerFirstNameGroup = $('<div class="form-group">'),
        registerFirstName = $('<input type="text" class="form-control" placeholder="First name"></input>'),
        registerLastNameGroup = $('<div class="form-group">'),
        registerLastName = $('<input type="text" class="form-control" placeholder="Last name"></input>'),
        registerEmailGroup = $('<div class="form-group">'),
        registerEmail = $('<input type="text" class="form-control" placeholder="Email"></input>'),
        registerPasswordGroup = $('<div class="form-group">'),
        registerPassword = $('<input type="password" class="form-control" placeholder="Password"></input>'),
        registerPassword2Group = $('<div class="form-group">'),
        registerPassword2 = $('<input type="password" class="form-control" placeholder="Password"></input>'),
        registerValidationFailedMessage = $('<div></div>'),
        registerButton = $('<button type="submit" class="btn btn-primary">Register</button>');

    $.ajax({
        dataType: "json",
        url: '/girder/api/v1/user/authentication',
        type: 'GET',
        success: function(resp) {
            if (options.login) {
                options.login(resp);
            }
            user.text("Logged in as " + resp.user.firstName + " " + resp.user.lastName + ". ");
            logoutMenu.removeClass("hidden");
            loginOrRegister.addClass("hidden");
        },
        error: function () {
            user.text("Logged out. ");
            loginOrRegister.removeClass("hidden");
            logoutMenu.addClass("hidden");
        }
    });

    this.append(user);
    this.append(logoutMenu);
    this.append(loginOrRegister);
    loginOrRegister.append(loginMenu);
    loginOrRegister.append(' or ');
    loginOrRegister.append(registerMenu);
    loginOrRegister.append('.');

    $("body").append(loginModal);
    loginModal.append(loginDialog);
    loginDialog.append(loginContent);
    loginContent.append(loginBody);
    loginBody.append(loginForm);
    loginForm.append(loginGroup);
    loginGroup.append('<label>Login or Email</label>');
    loginGroup.append(login);
    loginForm.append(passwordGroup);
    passwordGroup.append('<label>Password</label>');
    passwordGroup.append(password);
    loginForm.append(loginButton);

    $("body").append(registerModal);
    registerModal.append(registerDialog);
    registerDialog.append(registerContent);
    registerContent.append(registerBody);
    registerBody.append(registerValidationFailedMessage);
    registerBody.append(registerForm);
    registerForm.append(registerLoginGroup);
    registerLoginGroup.append('<label>Username</label>');
    registerLoginGroup.append(registerLogin);
    registerForm.append(registerFirstNameGroup);
    registerFirstNameGroup.append('<label>First name</label>');
    registerFirstNameGroup.append(registerFirstName);
    registerForm.append(registerLastNameGroup);
    registerLastNameGroup.append('<label>Last name</label>');
    registerLastNameGroup.append(registerLastName);
    registerForm.append(registerEmailGroup);
    registerEmailGroup.append('<label>Email</label>');
    registerEmailGroup.append(registerEmail);
    registerForm.append(registerPasswordGroup);
    registerPasswordGroup.append('<label>Password</label>');
    registerPasswordGroup.append(registerPassword);
    registerForm.append(registerPassword2Group);
    registerPassword2Group.append('<label>Verify password</label>');
    registerPassword2Group.append(registerPassword2);
    registerForm.append(registerButton);

    loginForm.submit(function (e) {
        var authStr = btoa(login.val() + ':' +
                           password.val());

        e.preventDefault();

        $.ajax({
            dataType: "json",
            url: '/girder/api/v1/user/authentication',
            type: 'GET',
            headers: {
                'Authorization': 'Basic ' + authStr
            },
            success: function (resp) {
                loginModal.modal("hide");
                if (options.login) {
                    options.login(resp);
                }
                login.val("");
                password.val("");
                user.text("Logged in as " + resp.user.firstName + " " + resp.user.lastName + ". ");
                logoutMenu.removeClass("hidden");
                loginOrRegister.addClass("hidden");
            },
            error: function () {
                // this.$('.g-validation-failed-message').text(err.responseJSON.message);
                user.text("Logged out. ");
                login.val("");
                password.val("");
                loginOrRegister.removeClass("hidden");
                logoutMenu.addClass("hidden");
            }
        });

        // this.$('.g-validation-failed-message').text('');
    });

    logoutMenu.click(function (e) {
        e.preventDefault();

        $.ajax({
            dataType: "json",
            url: '/girder/api/v1/user/authentication',
            type: 'DELETE',
            success: function (resp) {
                if (options.logout) {
                    options.logout(resp);
                }
                user.text("Logged out. ");
                loginOrRegister.removeClass("hidden");
                logoutMenu.addClass("hidden");
            }
        });
    });

    loginMenu.click(function () {
        loginModal.modal("show");
        login.focus();
    });


    registerMenu.click(function () {
        loginModal.modal("hide");
        registerModal.modal("show");
    });

    registerForm.submit(function (e) {
        e.preventDefault();

        if (registerPassword.val() !== registerPassword2.val()) {
            registerPassword.addClass('has-error');
            registerPassword2.addClass('has-error');
            registerPassword.focus();
            registerValidationFailedMessage.text('Passwords must match.');
            return;
        }
        $.ajax({
            dataType: "json",
            url: '/girder/api/v1/user',
            type: 'POST',
            data: {
                login: registerLogin.val(),
                password: registerPassword.val(),
                email: registerEmail.val(),
                firstName: registerFirstName.val(),
                lastName: registerLastName.val()
            },
            success: function (resp) {
                registerModal.modal("hide");
                if (options.login) {
                    $.ajax({
                        dataType: "json",
                        url: '/girder/api/v1/user/authentication',
                        type: 'GET',
                        success: function(resp) {
                            if (options.login) {
                                options.login(resp);
                            }
                        }
                    });
                }
                user.text("Logged in as " + resp.firstName + " " + resp.lastName + ". ");
                logoutMenu.removeClass("hidden");
                loginOrRegister.addClass("hidden");

                registerLogin.val("");
                registerPassword.val("");
                registerPassword2.val("");
                registerEmail.val("");
                registerFirstName.val("");
                registerLastName.val("");
            },
            error: function (err) {
                var resp = err.responseJSON;
                registerValidationFailedMessage.text(resp.message);
                if (resp.field) {
                    this.$('#g-group-' + resp.field).addClass('has-error');
                    this.$('#g-' + resp.field).focus();
                }
            }
        });

        registerValidationFailedMessage.text('');
    });
};