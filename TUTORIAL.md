So, you want to write a desktop app with Envelope, PostgreSQL or both! You're in the right place.

We're going to go through the minimum number of steps to create a simple desktop application using this Letterbox Example project.

### Prerequisites

Technically, you don't need [Git](https://git-scm.com/) but it's awfully convenient. For detailed instructions on how to install Git for your OS, go here: [install Git](https://git-scm.com/downloads).

Next you'll need [Yarn](https://yarnpkg.com). IF you're on Mac you need to follow [these instructions](https://github.com/creationix/nvm#install-script). Note: do not use Homebrew to install Yarn on a Mac. For all other platforms, detailed instructions on how to install Yarn are available here: [install yarn](https://yarnpkg.com/en/docs/install).

Yarn is a hard requirement because deploying to multiple platforms would be potentially very buggy without the ability to specify exact package versions.

### Get the repo

If you have Git, go to a nice place for your repo and type:

    git clone https://github.com/workflowproducts/letterbox-example.git
    cd letterbox-example

This will create a folder named letterbox-example and then make it the current folder. If you don't have Git then go to the [Github/letterbox-example](https://github.com/workflowproducts/letterbox-example) website and download it.
 
## Summary of the Development Process 

Letterbox can be used to create binary packages of your desktop application for Linux, Mac and Windows, but to do that, you need to set up and follow the remaining instructions on each platform you target. This is why using Git can be handy for this process. You'll need to keep your project files up to date on multiple computers if you want to target users on multiple platforms. 

### Fetch dependancies into your project

What we need to do now is fetch all the appropriate binaries for the platform we're on.

  yarn install
  
Example output:
```
  yarn install v0.16.1
  [1/4] 🔍  Resolving packages...
  [2/4] 🚚  Fetching packages...
  warning 7zip-bin-linux@1.0.3: The platform "darwin" is incompatible with this module.
  info "7zip-bin-linux@1.0.3" is an optional dependency and failed compatibility check. Excluding it from installation.
  warning 7zip-bin-win@2.0.2: The platform "darwin" is incompatible with this module.
  info "7zip-bin-win@2.0.2" is an optional dependency and failed compatibility check. Excluding it from installation.
  [3/4] 🔗  Linking dependencies...
  [4/4] 📃  Building fresh packages...
  success Saved lockfile.
  ✨  Done in 69.71s.
```

Note that we got several warnings about incompatibilities. These are ok. Usually it means that we did load the appropriate binary, but that an inapproriate one was not loaded.

### Do we have a correct and complete setup?

Let's start the app. If it comes up that will tell us whether we've got everything we need installed. 

  yarn start
  
Here's the highlights of what you should see in the terminal:

```
yarn start v0.16.1

...

Success. You can now start the database server using:

    /Users/jtocci/Repos/letterbox-example/node_modules/postgresql-portable-darwin64/bin/pg_ctl -D /Users/jtocci/.letterbox-example/data -l logfile start

...

Open http://<this computer's ip>:62300/ in your web browser
```

### Success!

If your app started then all is well. If it didn't, please file a detailed issue [here](https://github.com/workflowproducts/letterbox-example/issues) and we'll get right on it. Please provide your OS version number.

### Understanding the Startup Output

The skipped portions will just be a bunch of output relating to the creation of the PostgreSQL database and database objects. The next thing that should happen is the app should start up on your desktop. 

### Shutdown Output

It's a To-Do app based on the website [todomvc.com](http://todomvc.com/). To stop the app go to your terminal and hit ctrl-c or from within the app you can go to the "File" menu and choose the last item in the dropdown. You should get something like the following output in your terminal:

```
quitting
quitting
envelope 9761 got data (stderr):
POSTAGE IS SHUTTING DOWN

postgres 9754 got data:
LOG:  received smart shutdown request
LOG:  autovacuum launcher shutting down
LOG:  shutting down
LOG:  database system is shut down

9754 closed with code 0
envelope 9761 closed with code 0
✨  Done in 177.75s.
```

Note that the current version of Envelope says "POSTAGE IS SHUTTING DOWN" when it shuts down. This will hopefully be changed to say "ENVELOPE IS SHUTTING DOWN" soon.

But that isn't the important bit. What's important is that your entire app's lifecycle has been handled for you.

When the app started it noticed there wasn't an existing database, so it initialized a database. Then it started up Envelope and PostgreSQL. When it shut down, it shut down Envelope and PostgreSQL responsibly. Then on the next start it fired up Envelope and PostgreSQL again and all your data is right where you left it.

### About the PostgreSQL Database

Note that the database is initialized in your home folder. This means that if you delete the app, your data is not deleted. You can download a new version of the app and your data will be available in the new app. 

Right now we're using PostgreSQL 9.6.0. At some future point we plan to include the ability to dump and reload databases when Postcard detects an incompatible database. That way when a user upgrades and the PostgreSQL executable is incompatible,  the user doesn't lose their data.

### About the menu

In the developer's version of your app, you'll see a more complete version of the Electron menu. The additional choices are handy for development purposes. 

In a dist version of the app on Mac, the menu is not attached to the app's window. It's on the top menu bar. On other platforms, the menu bar appears at the top of the app's windows.

## Time to examine the project files

Next we'll review all the files that you need to write to make this app come together. 

### index.js

The index.js file provided in this project is mostly just boilerplate that you would want to include in most any project that includes Letterbox and Postcard. I recommend you start with the existing file for your first project. Lets see what it contains.

```
  const letterbox = require('letterbox'); // optional, add this if you need Envelope to ship with your app.
  const postcard = require('postcard');   // optional, add this if you need PostgreSQL to ship with your app.
  const electron = require('electron');   // required
```

It's entirely possible to create an app with Envelope and then connect to a remote instance of PostgreSQL. Or you could create an app with just PostgreSQL. If you do want a Postcard app, note that there is a [Postcard Example project](https://github.com/workflowproducts/postcard-example) on Github which is very similar to this one.

The next two lines are Electon related.

```
  const app = electron.app;                     // Module to control application lifecycle.
  const BrowserWindow = electron.BrowserWindow; // Module to create native browser window.

  let mainWindows = [];  // "let" is just a pretentious way of saying "var". This is just plain Javascript here.
```
  
The next section is an "on ready" function. Javascript programmers will know that, in a web page context, this event fires when the page loads. In this case, we have a Javascript engine emitting and listening for lifecycle events without a web bage, browser or renderer. Electron is a Node application, and when the application lifecycle reaches various states, events are emitted. In this case, when the node app is ready, the event is triggered and the "ready" function fires.

At this point it might help to point out, when it comes time to do something unfamiliar, you want to search for Electron resources first, but then if you can't find what you're looking for immediately, chances are any node resource will likely have a good answer. There's tons of info on Node online. This stuff isn't rocket science. It's just a Javascript script very similar to the sort of script you'd see in any web page. There are two big differences. 

The first is the dependancies. Since Node is a server technology there are a ton of modules out there that can help you build your app much more quickly than you could on your own. 

The second is the event model is running in the application context. That means that where in a web page "on ready" means when the page loads, in an app context it means the app is ready to go. But don't think about comparing the two contexts. When you're in a web page you might want to emit an event when the user does something. In Node you're going to want to throw an event when stuff happens to the application.

Back to my original point, the rest of this stuff is just Javascript and it's pretty straightforward.

```
  app.on('ready', function () {
    
    // 1) boilerplate managing PostgreSQL instance
    postcard.init('letterbox-example', function (postgresPort) {
      var curWindow = new BrowserWindow({
        'width': 1024,
        'height': 768
      });
      mainWindows.push(curWindow);  // Electron, add current Window to the array of windows.
      
      // 2) boilerplate managing Envelope instance
      letterbox.init('letterbox-example', (process.platform == 'win32' ? '127.0.0.1' : '/tmp'), 
          postgresPort, function (envelopePort) {
        curWindow.loadURL('http://127.0.0.1:' + envelopePort, {  
          'extraHeaders': 'pragma: no-cache\n'
        });
      });

      // 3) Emitted when the window is closed.
      curWindow.on('closed', function() {
        mainWindows.splice(mainWindows.indexOf(curWindow), 1);
      });
    });
  });
```

In review, in the first section we've got some code starting up PostgreSQL and opening the main window. Then we add that window to the window array so that we always know how many windows are open. 

Next we have some code starting up Envelope. Once Envelope is started we use that as our web server and open the first URL through there. This causes the page to load index.html through Envelope. 

In the third section we have set a trigger on the "on closed" event. This way we remove each window from the window array when it is closed. It keeps our main window array in sync with how many windows are open at any point.

### index.js continued

In the next section we listen for the application "quit" event and shut down Envelope and PostgreSQL appropriately. This is just boilerplate that you shouldn't have to update much.

```
  app.on('quit', function() {
          letterbox.quit();
          postcard.quit();
  });
```

Here we listen for the app's "window-all-closed" event. When that happens we quit the app and we're all done.

```
  // Quit when all windows are closed.
  app.on('window-all-closed', function () {
          app.quit();
  });
```

### Expanding your application's menu

We've covered the provided index.js file. As you work on your app, you're going to want to add stuff to the File, Edit, View or Window menu's. You do that here, in the index.js file. I'm not going to cover any of that today but I will point out that on Github alone there are 540 index.js files. A lot of those are going to have cool code that you can learn from and add features to your application's menu.

@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
You also use the index.js file for ... (needs work!!!!)
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@


### package.json

This document is fun. We can start customizing the feel of the app here. We can set the name of the app, version, description, etc... 


























