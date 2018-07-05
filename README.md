# usi

## Installation

to install usi (Version **0.5 and above**) you need **Mozilla Firefox in version 57+**, 
the versions of usi are available at [addons.mozilla.org](https://addons.mozilla.org/de/firefox/addon/userunified-script-injector/)

## run on computer
```
1. npm i
2. npm run webpack
3. npm run browser
```

## debug on computer
If you want to **debug usi**, go to page about:debugging in Firefox
and activate the checkbox **Enable add-on debugging**
then you can click on the **Debug** button
```
about:debugging
```

## build
if you want to build usi from source, you will need to install 
* [NodeJS](https://nodejs.org)
* [web-ext Module](https://github.com/mozilla/web-ext)
* [Firefox Unbranded Build](https://wiki.mozilla.org/Add-ons/Extension_Signing#Latest_Builds) (only a suggestion)

and then you can build usi (from it's root directory) with this short command in your commandline/shell
```
1. npm i
2. npm run build-prepare
```

## running/debug on Firefox for Android
For running on Firefox for Android, you have to build usi with
```
npm run build-prepare
```
1. you have to rename the file ending from .zip to .xpi
2. transfer the xpi file to your phone/emulator (e.g. `adb push /home/user/usi/web-ext-artifacts/firefox-addon-usi_jetpack-0.5.1.9.xpi /sdcard/.`)
3. start your Firefox for Android
4. go to `about:config` and change 'xpinstall.signatures.required' to **false**
5. enter the file url (e.g. `file:///sdcard/firefox-addon-usi_jetpack-0.5.1.9.xpi` )
6. allow install, and then you will find a new menu entry called "USI Options"

If you need more informations about this, please take a look at [Developing_WebExtensions_for_Firefox_for_Android](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Developing_WebExtensions_for_Firefox_for_Android)

## Contributors

If you encounter any bugs, or you have any suggestions for usi, feel free to create an issue on bitbucket.

## License

usi is available under the terms and conditions of the [LGPL-2.1](https://opensource.org/licenses/LGPL-2.1) License.