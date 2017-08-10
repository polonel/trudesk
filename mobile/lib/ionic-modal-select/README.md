# ionic-modal-select

Modal select for Ionic Framework based on [$ionicModal](http://ionicframework.com/docs/api/service/$ionicModal/)

See all docs and examples on the [project site](http://inmagik.github.io/ionic-modal-select).

We also have a simple [Codepen demo](http://codepen.io/bianchimro/pen/epYYQO?editors=101).

![animated example](https://dl.dropboxusercontent.com/u/6178230/screenshots/ionic-modal-picker.gif)

## IMPORTANT NOTICE

**In order to survive, this project needs**:
* proper testing: see [issue #26](https://github.com/inmagik/ionic-modal-select/issues/26)  
* co-maintainers: see [issue #54](https://github.com/inmagik/ionic-modal-select/issues/54)

Any help on this is greatly appreciated. Comment directly those issues or contact me directly at mauro.bianchi at inmagik.com if you are interested in helping with this.

## Features

* supports long list of object via collection-repeat
* optional search bar
* supports unsetting the chosen value (optional)
* customizable modal classes, modal header and footer classes
* customizable buttons text
* multiple selectable options (experimental)

## Usage

Get the files from github or install from bower:
```
bower install ionic-modal-select
```


Include `ionic-modal-select.js` or its minified version in your index.html:

```html

<script src="lib/ionic-modal-select/dist/ionic-modal-select.js"></script>

```


Add the module `ionic-modal-select` to your application dependencies:

```javascript

angular.module('starter', ['ionic', 'ionic-modal-select'])

```

And you're ready to go.


## Directives

### modal-select

This directive will transform the element into a modal select: when clicking the element a select dialog will be open, with options presented in a clickable list. Once the user clicks on an option, it will be set on the bound model.

For this to work the following conditions must apply:

* The element you use this directive must be clickable.
* The directive requires ngModel to be set on the element
* The directive expects an inner element of class "option" to define the options template

The final value bound to your model will be determined as follow:

* if you set the attribute `option-getter` will be set as `getterFunction(selectedItem)`
* if you set the attribute `option-property` will be set as `selectedItem[propertyName]`
* otherwise it will be set as the full object


In case of "multiple" selection mode, the user is allowed to select multiple options and
the bound ng-model will be a list containing the selected options, with the same logic
of getting the value.


#### Options

option|meaning|accepted values|default
---|---|---|---
`options`|List of options to choose from|Array||
`options-expression`|The expression indicating how to enumerate a the options collection, of the format `variable in expression` – where variable is the user defined loop variable and expression is a scope expression giving the collection to enumerate. For example: `album in artist.albums or album in artist.albums | orderBy:'name'`.|expression||
`option-getter`|Optional method to get the value from the chosen item|function|not set|
`option-property`|Optional property name to get as model value from the chosen item|string|not set|
`multiple`|If set (to any value) enables "multiple" selection mode that allows the user to select more than one option. For each option, a checkbox will be rendered. *This feature is still experimental*. |string|not set|
`modal-class`|The class for the modal (set on `<ion-modal-view>`|string|''
`selected-class`|The class applied to the currently selected option (if any) in the modal list|string|'option-selected'
`on-select`|Callback triggered on object select. Takes two arguments, `newValue` and `oldValue` with obvious meaning.|function call with arguments `newValue` and `oldValue`|not set
`on-reset`|Callback triggered when value is resetted using the relevant ui interface. Takes no arguments.|function call|not set
`on-close`|Callback triggered when modal is closed (in any way, uses 'modal.hidden' ionic event). Takes no arguments.|function call|not set
`modal-title`|The title shown on the modal header|string|'Select an option'
`header-footer-class`|The class for header and footer of the modal|string|'bar-stable'
`cancel-button`|Text of the button for closing the modal without changing the value|string|'Cancel'
`reset-button`|Text of the button for unsetting value in the modal dialog|string|'Reset'
`hide-reset`|Hides the button for unsetting value in the modal dialog|string. Set to 'true' for hiding the button|false
`use-collection-repeat`|Forces use of collection-repeat or ng-repeat for rendering options in the modal.| string "true", "false" | not set (automatically set according to number of options and `short-list-break` attribute)
`short-list-break`|The maximum number of item in list to be rendered with `ng-repeat`.(if `use-collection-repeat` is not set) If the list has a number of options greater than this attribute it will be rendered with ionic `collection-repeat` directive instead. (see also `load-list-message` option)|integer|10
`load-list-message`|Message to be shown when loading a long list of options in the modal|string|'Loading'
`has-search`|Whether to show a search bar to filter options.|set to "true" for showing the search bar|undefined
`search-placeholder`|String placeholder in search bar.|string|'Search'
`sub-header-class`|Class to be applied to the subheader containing the search bar (makes sense only if `has-search="true`) |string|'bar-stable'
`cancel-search-button`|Text for the button for clearing search text (makes sense only if `has-search="true`) |string|'Clear'
`clear-search-on-select`|Tells the directive to not clear the search bar content after user selection. Set to `false` to prevent clearing the search text.|boolean|true
`search-properties`|Array of properties for the search. For example: In your controller `$scope.searchProperties = ['property1', 'property2'];` and in template attributes `search-properties="searchProperties"`|Array


### Passing in options

The `modal-select` directive must be provided with a set of options to choose from

This can be done in two ways:

* via the `options` attribute, that accepts an array of values or objects. The directive will watch for changes in this array and modify its options accordingly.
* via the `options-expression` attribute, that accepts an expression similar to what you would use with ionic `collection-repeat` directive, of the format `variable in expression` – where variable is the user defined loop variable and expression is a scope expression giving the collection to enumerate. For example: `album in artist.albums or album in artist.albums | orderBy:'name'`. This allows you to apply ordering or filtering without acting on the original array.


### Options templates

This directive expects to find a single inner element of class "option" that is used to define the template of the options that can be selected. Options will be rendered as items into a list in the modal (The content of each option, rendered with your template, is wrapped in an element of class 'item item-text wrap' and the original ".option" element is removed).

For example:
```html
<button class="button button-positive" modal-select ng-model="someModel" options="selectables" modal-title="Select a number">
    Select it
    <div class="option">
        {{option}}
    </div>
</button>
```

Will be rendered in the modal as :

```html
<div class="item item-text-wrap">
    {{option}}
</div>
```

## Multiple selection mode
From version 1.3.1, setting `multiple` attribute to any value other than "undefined" will enable the multiple selection on the widget. In this case, the user is allowed to select more than one option and options will be rendered with checkboxes in the selection modal. *This feature is still experimental*.


## Search bar
From version 1.1.0 you can include a search bar into the modal for filtering options by simply adding the attribute `has-search="true"` to your `modal-select` element.

Filtering is implemented with the angular `filter` filter, which searches recursively in all properties of the objects passed in as options. This means that you cannot search on "computed properties" right now. For example if you are using a custom setter you will be only able to search the original properties of the options.


### Examples
#### Simplest one.
This example shows a modal for choosing a number between 1 and 5.

In your controller:

```js
$scope.selectables = [1,2,3,4,5];
```
In your template:

```html
<button class="button button-positive" modal-select ng-model="someModel" options="selectables" modal-title="Select a number">
    Select it
    <div class="option">
        {{option}}
    </div>
</button>
```

#### Including a search bar
To include a search bar in the previous example, just add `has-search="true"`:

```html
<button class="button button-positive" modal-select ng-model="someModel" options="selectables" modal-title="Select a number" has-search="true">
    Select it
    <div class="option">
        {{option}}
    </div>
</button>
```


#### Objects as options
In the following example we use some objects as options.


In your controller:

```js
$scope.selectables = [
    { name: "Mauro", role : "navigator"},
    { name: "Silvia", role : "chef"},
    { name: "Merlino", role : "canaglia"}
];
```

We'll explore different possibilities we have with this options.

##### 1. Setting the full object

If we do not set `option-getter` or `option-property` attributes, the model is assigned to the full option object when an option is selected.

```html
<button class="button button-positive" modal-select ng-model="someModel" options="selectables" modal-title="Select a character">
    Select it
    <div class="option">
        {{option.name}} ({{option.role}})
    </div>
</button>
```




##### 2. Setting a property
If `option-property` attribute is set to a string, the bound model assigned that  property of the option object when an option is selected. For example if we set `option-getter="name"`, we get back the 'name' property of our options.

```html
<button class="button button-positive" modal-select ng-model="someModel" options="selectables" modal-title="Select a character" option-property="name">
    Select it
    <div class="option">
        {{option.name}} ({{option.role}})
    </div>
</button>
```

##### 3. Custom setter
If a function call is passed via `option-getter` attribute, the bound model assignment is done by calling this function with the selected option as the only argument (named 'option'). For example if we do this in our controller:

```javascript
$scope.getOption = function(option){
    return option.name + ":" + option.role;
};
```

```html
<button class="button button-positive" modal-select ng-model="someModel" options="selectables" modal-title="Select a character" option-getter="getOption(option)">
    Select it
    <div class="option">
        {{option.name}} ({{option.role}})
    </div>
</button>
```

##### 4. Specify the properties for search
Specify in the array the properties' name for search `$scope.search_properties = ['propertie_1', 'propertie_2', '...'];`:
```javascript
$scope.search_properties = ['name'];
```
```html
<button class="button button-positive" modal-select ng-model="someModel" options="selectables" modal-title="Select a character" option-getter="getOption(option)" search-properties="search_properties">
    Select it
    <div class="option">
        {{option.name}} ({{option.role}})
    </div>
</button>
```

We get back the phrase "Mauro:navigator", "Silvia:chef" or "Merlino:canaglia" if we click the previous defined options.


##### More examples [on the project site](http://inmagik.github.io/ionic-modal-select).

## Support this project

This software package is available for free with a MIT license, but
if you find it useful and want support its development consider buying a copy on the [Ionic Marketplace](http://market.ionic.io/plugins/ionic-modal-select) for just a few bucks.
