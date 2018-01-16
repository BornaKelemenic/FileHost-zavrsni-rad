const User = require('../models/user'); // Import User Model
const File = require('../models/file'); // Import File Model
const jwt = require('jsonwebtoken'); // Import JWT Package
const secret = 'nekidugackistringzawebtoken';

module.exports = function (router)
{
    // Route to register new users  
    router.post('/users', function (req, res)
    {
        let user = new User(); // Create new User object
        user.username = req.body.username; // Save username from request to User object
        user.password = req.body.password; // Save password from request to User object
        user.email = req.body.email; // Save email from request to User object
        user.name = req.body.name; // Save name from request to User object

        // Check if request is valid and not empty or null
        if (req.body.username === null || req.body.username === '' || req.body.password === null || req.body.password === '' || req.body.email === null || req.body.email === '' || req.body.name === null || req.body.name === '')
        {
            res.json({success: false, message: 'Ensure username, email, and password were provided'});
        }
        else
        {
            // Save new user to database
            user.save(function (error)
            {
                if (error)
                {
                    if (error.errors.email)
                    {
                        res.json({success: false, message: error.errors.email.message});
                    }
                    else if (error.errors.username)
                    {
                        res.json({success: false, message: error.errors.username.message});
                    }
                    else if (error.errors.password)
                    {
                        res.json({success: false, message: error.errors.password.message});
                    }
                    else
                        res.json({success: false, message: error.errors});
                }
                else
                    res.json({success: true, message: "User created."});
            });
        }
    });

    // Route to check if username chosen on registration page is taken
    router.post('/checkusername', function (req, res)
    {
        User.findOne({username: req.body.username}).select('username').exec(function (err, user)
        {
            if (err)
            {
                throw err;
            }
            else
            {
                if (user)
                {
                    res.json({success: false, message: 'That username is already taken'}); // If user is returned, then username is taken
                }
                else
                {
                    res.json({success: true, message: 'Valid username'}); // If user is not returned, then username is not taken
                }
            }
        });
    });

    // Route to check if e-mail chosen on registration page is taken    
    router.post('/checkemail', function (req, res)
    {
        User.findOne({email: req.body.email}).select('email').exec(function (err, user)
        {
            if (err)
            {
                throw err;
            }
            else
            {
                if (user)
                {
                    res.json({success: false, message: 'That e-mail is already taken'}); // If user is returned, then e-mail is taken
                }
                else
                {
                    res.json({success: true, message: 'Valid e-mail'}); // If user is not returned, then e-mail is not taken
                }
            }
        });
    });

    // Route for user logins
    router.post('/authenticate', function (req, res)
    {
        let loginUser = req.body.username; // Ensure username is checked in database
        User.findOne({username: loginUser}).select('email username password active').exec(function (err, user)
        {
            if (err)
            {
                throw err;
            }
            else
            {
                // Check if user is found in the database (based on username)
                if (!user)
                {
                    res.json({success: false, message: 'Username not found'}); // Username not found in database
                }
                else if (user)
                {
                    // Check if user does exist, then compare password provided by user
                    if (!req.body.password)
                    {
                        res.json({success: false, message: 'No password provided'}); // Password was not provided
                    }
                    else
                    {
                        let validPassword = user.comparePassword(req.body.password); // Check if password matches password provided by user
                        if (!validPassword)
                        {
                            res.json({success: false, message: 'Could not authenticate password'}); // Password does not match password in database
                        }
                        else
                        {
                            let token = jwt.sign({
                                username: user.username,
                                email: user.email
                            }, secret, {expiresIn: '24h'}); // Logged in: Give user token
                            res.json({success: true, message: 'User authenticated!', token: token}); // Return token in JSON object to controller
                        }
                    }
                }
            }
        });
    });

    // FILE DOWNLOAD ROUTE
    router.get('/file/:folder', function (req, res)
    {
        let trazeniFile = req.params.folder + '/';

        File.findOne({fileLocation: trazeniFile}, function (err, file)
        {
            if (err)
            {
                throw err;
            }
            else
            {
                if (!file)
                {
                    res.json({success: false, message: 'No file found', tf: trazeniFile}); // Return error
                }
                else
                {
                    res.json({ success: true, file: file }); // Return file
                }
            }
        });
    });


    // Middleware for Routes that checks for token - Place all routes after this route that require the user to already be logged in
    router.use(function (req, res, next)
    {
        let token = req.body.token || req.body.query || req.headers['x-access-token']; // Check for token in body, URL, or headers

        // Check if token is valid and not expired  
        if (token)
        {
            // Function to verify token
            jwt.verify(token, secret, function (err, decoded)
            {
                if (err)
                {
                    res.json({success: false, message: 'Token invalid'}); // Token has expired or is invalid
                }
                else
                {
                    req.decoded = decoded; // Assign to req. variable to be able to use it in next() route ('/me' route)
                    next();
                }
            });
        }
        else
        {
            res.json({success: false, message: 'No token provided'}); // Return error if no token was provided in the request
        }
    });

    // Route to get the currently logged in user    
    router.post('/me', function (req, res)
    {
        res.send(req.decoded); // Return the token acquired from middleware
    });

    // Route to provide the user with a new token to renew session
    router.get('/renewToken/:username', function (req, res)
    {
        User.findOne({username: req.params.username}).select('username email').exec(function (err, user)
        {
            if (err)
            {
                throw err;
            }
            else
            {
                // Check if username was found in database
                if (!user)
                {
                    res.json({success: false, message: 'No user was found'}); // Return error
                }
                else
                {
                    let newToken = jwt.sign({username: user.username, email: user.email}, secret, {expiresIn: '24h'}); // Give user a new token
                    res.json({success: true, token: newToken}); // Return newToken in JSON object to controller
                }
            }
        });
    });

    // Route to get the current user's permission level
    router.get('/permission', function (req, res)
    {
        User.findOne({username: req.decoded.username}, function (err, user)
        {
            if (err)
            {
                throw err;
            }
            else
            {
                // Check if username was found in database
                if (!user)
                {
                    res.json({success: false, message: 'No user was found'}); // Return an error
                }
                else
                {
                    res.json({success: true, permission: user.permission}); // Return the user's permission
                }
            }
        });
    });

    // Route to get all users for management page
    router.get('/management', function (req, res)
    {
        User.find({}, function (err, users)
        {
            if (err)
            {
                throw err;
            }
            else
            {
                User.findOne({username: req.decoded.username}, function (err, mainUser)
                {
                    if (err)
                    {
                        throw err;
                    }
                    else
                    {
                        // Check if logged in user was found in database
                        if (!mainUser)
                        {
                            res.json({success: false, message: 'No user found'}); // Return error
                        }
                        else
                        {
                            // Check if user has editing/deleting privileges 
                            if (mainUser.permission === 'admin' || mainUser.permission === 'moderator')
                            {
                                // Check if users were retrieved from database
                                if (!users)
                                {
                                    res.json({success: false, message: 'Users not found'}); // Return error
                                }
                                else
                                {
                                    res.json({success: true, users: users, permission: mainUser.permission}); // Return users, along with current user's permission
                                }
                            }
                            else
                            {
                                res.json({success: false, message: 'Insufficient Permissions'}); // Return access error
                            }
                        }
                    }
                });
            }
        });
    });

    // Route to delete a user
    router.delete('/management/:username', function (req, res)
    {
        let deletedUser = req.params.username; // Assign the username from request parameters to a variable
        User.findOne({username: req.decoded.username}, function (err, mainUser)
        {
            if (err)
            {
                throw err;
            }
            else
            {
                // Check if current user was found in database
                if (!mainUser)
                {
                    res.json({success: false, message: 'No user found'}); // Return error
                }
                else
                {
                    // Check if curent user has admin access
                    if (mainUser.permission !== 'admin')
                    {
                        res.json({success: false, message: 'Insufficient Permissions'}); // Return error
                    }
                    else
                    {
                        // Fine the user that needs to be deleted
                        User.findOneAndRemove({username: deletedUser}, function (err, user)
                        {
                            if (err)
                            {
                                throw err;
                            }
                            else
                            {
                                res.json({success: true}); // Return success status
                            }
                        });
                    }
                }
            }
        });
    });

    // Route to get the user that needs to be edited
    router.get('/edit/:id', function (req, res)
    {
        let editUser = req.params.id; // Assign the _id from parameters to variable
        User.findOne({username: req.decoded.username}, function (err, mainUser)
        {
            if (err)
            {
                throw err;
            }
            else
            {
                // Check if logged in user was found in database
                if (!mainUser)
                {
                    res.json({success: false, message: 'No user found'}); // Return error
                }
                else
                {
                    // Check if logged in user has editing privileges
                    if (mainUser.permission === 'admin' || mainUser.permission === 'moderator')
                    {
                        // Find the user to be editted
                        User.findOne({_id: editUser}, function (err, user)
                        {
                            if (err)
                            {
                                throw err;
                            }
                            else
                            {
                                // Check if user to edit is in database
                                if (!user)
                                {
                                    res.json({success: false, message: 'No user found'}); // Return error
                                }
                                else
                                {
                                    res.json({success: true, user: user}); // Return the user to be editted
                                }
                            }
                        });
                    }
                    else
                    {
                        res.json({success: false, message: 'Insufficient Permission'}); // Return access error
                    }
                }
            }
        });
    });

    // Route to update/edit a user
    router.put('/edit', function (req, res)
    {
        let editUser = req.body._id; // Assign _id from user to be editted to a variable
        if (req.body.name)
            var newName = req.body.name; // Check if a change to name was requested

        if (req.body.username)
            var newUsername = req.body.username; // Check if a change to username was requested

        if (req.body.email)
            var newEmail = req.body.email; // Check if a change to e-mail was requested

        if (req.body.permission)
            var newPermission = req.body.permission; // Check if a change to permission was requested

        // Look for logged in user in database to check if have appropriate access
        User.findOne({username: req.decoded.username}, function (err, mainUser)
        {
            if (err)
            {
                throw err;
            }
            else
            {
                // Check if logged in user is found in database
                if (!mainUser)
                {
                    res.json({success: false, message: "no user found"}); // Return error
                }
                else
                {
                    // Check if a change to name was requested
                    if (newName)
                    {
                        // Check if person making changes has appropriate access
                        if (mainUser.permission === 'admin' || mainUser.permission === 'moderator')
                        {
                            // Look for user in database
                            User.findOne({_id: editUser}, function (err, user)
                            {
                                if (err)
                                {
                                    throw err;
                                }
                                else
                                {
                                    // Check if user is in database
                                    if (!user)
                                    {
                                        res.json({success: false, message: 'No user found'}); // Return error
                                    }
                                    else
                                    {
                                        user.name = newName; // Assign new name to user in database
                                        // Save changes
                                        user.save(function (err)
                                        {
                                            if (err)
                                            {
                                                console.log(err); // Log any errors to the console
                                            }
                                            else
                                            {
                                                res.json({success: true, message: 'Name has been updated!'}); // Return success message
                                            }
                                        });
                                    }
                                }
                            });
                        }
                        else
                        {
                            res.json({success: false, message: 'Insufficient Permissions'}); // Return error
                        }
                    }

                    // Check if a change to username was requested
                    if (newUsername)
                    {
                        // Check if person making changes has appropriate access
                        if (mainUser.permission === 'admin' || mainUser.permission === 'moderator')
                        {
                            // Look for user in database
                            User.findOne({_id: editUser}, function (err, user)
                            {
                                if (err)
                                {
                                    throw err;
                                }
                                else
                                {
                                    // Check if user is in database
                                    if (!user)
                                    {
                                        res.json({success: false, message: 'No user found'}); // Return error
                                    }
                                    else
                                    {
                                        user.username = newUsername; // Save new username to user in database
                                        // Save changes
                                        user.save(function (err)
                                        {
                                            if (err)
                                            {
                                                console.log(err); // Log error to console
                                            }
                                            else
                                            {
                                                res.json({success: true, message: 'Username has been updated'}); // Return success
                                            }
                                        });
                                    }
                                }
                            });
                        }
                        else
                        {
                            res.json({success: false, message: 'Insufficient Permissions'}); // Return error
                        }
                    }

                    // Check if change to e-mail was requested
                    if (newEmail)
                    {
                        // Check if person making changes has appropriate access
                        if (mainUser.permission === 'admin' || mainUser.permission === 'moderator')
                        {
                            // Look for user that needs to be editted
                            User.findOne({_id: editUser}, function (err, user)
                            {
                                if (err)
                                {
                                    throw err;
                                }
                                else
                                {
                                    // Check if logged in user is in database
                                    if (!user)
                                    {
                                        res.json({success: false, message: 'No user found'}); // Return error
                                    }
                                    else
                                    {
                                        user.email = newEmail; // Assign new e-mail to user in databse
                                        // Save changes
                                        user.save(function (err)
                                        {
                                            if (err)
                                            {
                                                console.log(err); // Log error to console
                                            }
                                            else
                                            {
                                                res.json({success: true, message: 'E-mail has been updated'}); // Return success
                                            }
                                        });
                                    }
                                }
                            });
                        }
                        else
                        {
                            res.json({success: false, message: 'Insufficient Permissions'}); // Return error
                        }
                    }

                    // Check if a change to permission was requested
                    if (newPermission)
                    {
                        // Check if user making changes has appropriate access
                        if (mainUser.permission === 'admin' || mainUser.permission === 'moderator')
                        {
                            // Look for user to edit in database
                            User.findOne({_id: editUser}, function (err, user)
                            {
                                if (err)
                                {
                                    throw err;
                                }
                                else
                                {
                                    // Check if user is found in database
                                    if (!user)
                                    {
                                        res.json({success: false, message: 'No user found'}); // Return error
                                    }
                                    else
                                    {
                                        // Check if attempting to set the 'user' permission
                                        if (newPermission === 'user')
                                        {
                                            // Check the current permission is an admin
                                            if (user.permission === 'admin')
                                            {
                                                // Check if user making changes has access
                                                if (mainUser.permission !== 'admin')
                                                {
                                                    res.json({
                                                        success: false,
                                                        message: 'Insufficient Permissions. You must be an admin to downgrade an admin.'
                                                    }); // Return error
                                                }
                                                else
                                                {
                                                    user.permission = newPermission; // Assign new permission to user
                                                    // Save changes
                                                    user.save(function (err)
                                                    {
                                                        if (err)
                                                        {
                                                            console.log(err); // Long error to console
                                                        }
                                                        else
                                                        {
                                                            res.json({
                                                                success: true,
                                                                message: 'Permissions have been updated!'
                                                            }); // Return success
                                                        }
                                                    });
                                                }
                                            }
                                            else
                                            {
                                                user.permission = newPermission; // Assign new permission to user
                                                // Save changes
                                                user.save(function (err)
                                                {
                                                    if (err)
                                                    {
                                                        console.log(err); // Log error to console
                                                    }
                                                    else
                                                    {
                                                        res.json({
                                                            success: true,
                                                            message: 'Permissions have been updated!'
                                                        }); // Return success
                                                    }
                                                });
                                            }
                                        }
                                        // Check if attempting to set the 'moderator' permission
                                        if (newPermission === 'moderator')
                                        {
                                            // Check if the current permission is 'admin'
                                            if (user.permission === 'admin')
                                            {
                                                // Check if user making changes has access
                                                if (mainUser.permission !== 'admin')
                                                {
                                                    res.json({
                                                        success: false,
                                                        message: 'Insufficient Permissions. You must be an admin to downgrade another admin'
                                                    }); // Return error
                                                }
                                                else
                                                {
                                                    user.permission = newPermission; // Assign new permission
                                                    // Save changes
                                                    user.save(function (err)
                                                    {
                                                        if (err)
                                                        {
                                                            console.log(err); // Log error to console
                                                        }
                                                        else
                                                        {
                                                            res.json({
                                                                success: true,
                                                                message: 'Permissions have been updated!'
                                                            }); // Return success
                                                        }
                                                    });
                                                }
                                            }
                                            else
                                            {
                                                user.permission = newPermission; // Assign new permssion
                                                // Save changes
                                                user.save(function (err)
                                                {
                                                    if (err)
                                                    {
                                                        console.log(err); // Log error to console
                                                    }
                                                    else
                                                    {
                                                        res.json({
                                                            success: true,
                                                            message: 'Permissions have been updated!'
                                                        }); // Return success
                                                    }
                                                });
                                            }
                                        }

                                        // Check if assigning the 'admin' permission
                                        if (newPermission === 'admin')
                                        {
                                            // Check if logged in user has access
                                            if (mainUser.permission === 'admin')
                                            {
                                                user.permission = newPermission; // Assign new permission
                                                // Save changes
                                                user.save(function (err)
                                                {
                                                    if (err)
                                                    {
                                                        console.log(err); // Log error to console
                                                    }
                                                    else
                                                    {
                                                        res.json({
                                                            success: true,
                                                            message: 'Permissions have been updated!'
                                                        }); // Return success
                                                    }
                                                });
                                            }
                                            else
                                            {
                                                res.json({
                                                    success: false,
                                                    message: 'Insufficient Permissions. You must be an admin to upgrade someone to the admin level'
                                                }); // Return error
                                            }
                                        }
                                    }
                                }
                            });
                        }
                        else
                        {
                            res.json({success: false, message: 'Insufficient Permissions'}); // Return error
                        }
                    }
                }
            }
        });
    });

    // Route to get all files uploaded by user
    router.get('/getFiles/', function (req, res)
    {
        File.find({username: req.decoded.username}, function (err, files)
        {
            if (err)
            {
                throw err;
            }
            else
            {
                // Check if files were found in database
                if (!files)
                {
                    res.json({success: false, message: 'No files found'}); // Return an error
                }
                else
                {
                    res.json({success: true, files: files}); // Return the user's files
                }
            }
        });
    });

    return router; // Return the router object to server
};