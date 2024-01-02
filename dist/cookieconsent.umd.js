/*!
* CookieConsent 3.0.0-rc.17
* https://github.com/orestbida/cookieconsent/tree/v3
* Author Orest Bida
* Released under the MIT License
*/

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.CookieConsent = {}));
})(this, (function (exports) { 'use strict';

    const COOKIE_NAME = 'cc_cookie';

    const OPT_IN_MODE = 'opt-in';
    const OPT_OUT_MODE = 'opt-out';

    const TOGGLE_CONSENT_MODAL_CLASS = 'show--consent';
    const TOGGLE_QR_MODAL_CLASS = 'show--qr';
    const TOGGLE_PREFERENCES_MODAL_CLASS = 'show--preferences';
    const TOGGLE_DISABLE_INTERACTION_CLASS = 'disable--interaction';

    const SCRIPT_TAG_SELECTOR = 'data-category';

    const DIV_TAG = 'div';
    const BUTTON_TAG = 'button';

    const ARIA_HIDDEN = 'aria-hidden';
    const BTN_GROUP_CLASS = 'btn-group';
    const CLICK_EVENT = 'click';
    const DATA_ROLE = 'data-role';

    const CONSENT_MODAL_NAME = 'consentModal';
    const PREFERENCES_MODAL_NAME = 'preferencesModal';
    const QR_MODAL_NAME = 'qrModal';

    /**
     * @typedef {import('../../types')} CookieConsent
     *
     * @typedef {CookieConsent} Api
     * @typedef {CookieConsent.CookieConsentConfig} UserConfig
     * @typedef {CookieConsent.Category} Category
     * @typedef {CookieConsent.Service} Service
     * @typedef {Object.<string, Service>} Services
     * @typedef {CookieConsent.AutoClear} AutoClear
     * @typedef {CookieConsent.GuiOptions} GuiOptions
     * @typedef {GuiOptions['consentModal']} GuiModalOption
     * @typedef {CookieConsent.CookieConsentConfig['language']} Language
     * @typedef {CookieConsent.Translation} Translation
     * @typedef {CookieConsent.ConsentModalOptions} ConsentModalOptions
     * @typedef {CookieConsent.PreferencesModalOptions} PreferencesModalOptions
     * @typedef {CookieConsent.CookieTable} CookieTable
     * @typedef {CookieConsent.Section} Section
     * @typedef {CookieConsent.CookieValue} CookieValue
     * @typedef {CookieConsent.UserPreferences} UserPreferences
     */

    /**
     * Internal state for each script tag
     * @typedef {Object} ScriptInfo
     * @property {HTMLScriptElement} _script
     * @property {string} _categoryName
     * @property {string} [_serviceName]
     * @property {boolean} _executed
     * @property {boolean} _runOnDisable
     */

    /**
     * Pointers to main dom elements
     * @typedef {Object} DomElements
     * @property {Document} _document
     * @property {HTMLElement} _htmlDom
     *
     * @property {HTMLElement} _ccMain
     * @property {HTMLElement} _cmContainer
     * @property {HTMLElement} _pmContainer
     * @property {HTMLElement} _qrmContainer
     *
     * @property {HTMLElement} _cm
     * @property {HTMLElement} _cmBody
     * @property {HTMLElement} _cmTexts
     * @property {HTMLElement} _cmTitle
     * @property {HTMLElement} _cmDescription
     * @property {HTMLElement} _cmBtns
     * @property {HTMLElement} _cmBtnGroup
     * @property {HTMLElement} _cmBtnGroup2
     * @property {HTMLElement} _cmAcceptAllBtn
     * @property {HTMLElement} _cmAcceptNecessaryBtn
     * @property {HTMLElement} _cmShowPreferencesBtn
     * @property {HTMLElement} _cmFooterLinksGroup
     * @property {HTMLElement} _cmCloseIconBtn
     *
     * @property {HTMLElement} _pm
     * @property {HTMLElement} _pmHeader
     * @property {HTMLElement} _pmTitle
     * @property {HTMLElement} _pmCloseBtn
     * @property {HTMLElement} _pmBody
     * @property {HTMLElement} _pmNewBody
     * @property {HTMLElement} _pmSections
     * @property {HTMLElement} _pmFooter
     * @property {HTMLElement} _pmAcceptAllBtn
     * @property {HTMLElement} _pmAcceptNecessaryBtn
     * @property {HTMLElement} _pmSavePreferencesBtn
     * 
     * @property {HTMLElement} _qr
     * @property {HTMLElement} _qrHeader
     * @property {HTMLElement} _qrTitle
     * @property {HTMLElement} _qrCloseBtn
     * @property {HTMLElement} _qrBody
     * @property {HTMLElement} _qrFooter
     *
     * @property {Object.<string, HTMLInputElement>} _categoryCheckboxInputs
     * @property {Object.<string, ServiceToggle>} _serviceCheckboxInputs
     *
     * // Used to properly restore focus when modal is closed
     * @property {HTMLSpanElement} _focusSpan
     * @property {HTMLSpanElement} _pmFocusSpan
     * @property {HTMLSpanElement} _qrmFocusSpan
     */

    /**
     * @typedef {Object} CustomCallbacks
     * @property {Function} _onFirstConsent
     * @property {Function} _onConsent
     * @property {Function} _onChange
     * @property {Function} _onModalShow
     * @property {Function} _onModalHide
     * @property {Function} _onModalReady
     */

    /**
     * Pointers to all services toggles relative to a category
     * @typedef {Object.<string, HTMLInputElement>} ServiceToggle
     */

    class GlobalState {
        constructor() {

            /**
             * Default config. options
             * @type {CookieConsent.CookieConsentConfig}
             */
            this._config = {
                mode: OPT_IN_MODE,
                revision: 0,

                //{{START: GUI}}
                autoShow: true,
                lazyHtmlGeneration: true,
                //{{END: GUI}}

                autoClearCookies: true,
                manageScriptTags: true,
                hideFromBots: true,

                cookie: {
                    name: COOKIE_NAME,
                    expiresAfterDays: 182,
                    domain: '',
                    path: '/',
                    sameSite: 'Lax'
                }
            };

            this._state = {
                /**
                * @type {UserConfig}
                */
                _userConfig: {},

                _currentLanguageCode: '',

                /**
                * @type {Object.<string, Translation>}
                */
                _allTranslations: {},

                /**
                * @type {Translation}
                */
                _currentTranslation: {},

                /**
                * Internal state variables
                * @type {CookieValue}
                */
                _savedCookieContent : {},

                /**
                 * Store all event data-cc event listeners
                 * (so that they can be removed on .reset())
                 *
                 * @type {{
                 *  _element: HTMLElement,
                 *  _event: string,
                 *  _listener: Function
                 * }[]}
                 */
                _dataEventListeners: [],

                _disablePageInteraction: false,

                /**
                * @type {any}
                */
                _cookieData : null,

                /**
                * @type {Date}
                */
                _consentTimestamp: null,

                /**
                * @type {Date}
                */
                _lastConsentTimestamp: null,

                /**
                * @type {string}
                */
                _consentId: '',

                _invalidConsent : true,

                //{{START: GUI}}
                _consentModalExists : false,
                _consentModalVisible : false,

                _preferencesModalVisible : false,
                _preferencesModalExists: false,

                _qrModalExists : false,
                _qrModalVisible : false,

                /**
                * @type {HTMLElement[]}
                */
                _currentModalFocusableElements: [],
                //{{END: GUI}}

                _revisionEnabled : false,
                _validRevision : true,

                /**
                * Array containing the last changed categories (enabled/disabled)
                * @type {string[]}
                */
                _lastChangedCategoryNames : [],

                _reloadPage : false,

                /**
                * @type {CookieConsent.AcceptType}
                */
                _acceptType: '',

                /**
                * Object containing all user's defined categories
                * @type {Object.<string, Category>}
                */
                _allDefinedCategories: false,

                /**
                * Stores all available categories
                * @type {string[]}
                */
                _allCategoryNames: [],

                /**
                * Contains all accepted categories
                * @type {string[]}
                */
                _acceptedCategories : [],

                /**
                * Keep track of readonly toggles
                * @type {string[]}
                */
                _readOnlyCategories : [],

                /**
                * Contains all categories enabled by default
                * @type {string[]}
                */
                _defaultEnabledCategories : [],

                /**
                * Don't run plugin if bot detected
                * (to avoid indexing its text content)
                */
                _botAgentDetected : false,

                /**
                * Save reference to the last focused element on the page
                * (used later to restore focus when both modals are closed)
                */

                //{{START: GUI}}

                /** @type {HTMLElement} **/_lastFocusedElemBeforeModal: false,
                /** @type {HTMLElement} **/_lastFocusedModalElement: false,

                /**
                * Both of the arrays below have the same structure:
                * [0]: first focusable element inside modal
                * [1]: last focusable element inside modal
                */

                /** @type {HTMLElement[]} **/ _cmFocusableElements : [],
                /** @type {HTMLElement[]} **/ _pmFocusableElements : [],
                /** @type {HTMLElement[]} **/ _qrmFocusableElements : [],

                /**
                * Keep track of enabled/disabled categories
                * @type {boolean[]}
                */
                _allToggleStates : [],

                //{{END: GUI}}

                /**
                * @type {Object.<string, Services>}
                */
                _allDefinedServices: {},

                /**
                * @type {Object.<string, string[]>}
                */
                _acceptedServices: {},

                /**
                 * Keep track of the current state of the services
                 * (may not be the same as enabledServices)
                 *
                 * @type {Object.<string, string[]>}
                 */
                _enabledServices: {},

                /**
                * @type {Object.<string, string[]>}
                */
                _lastChangedServices: {},

                /**
                * @type {Object.<string, string[]>}
                */
                _lastEnabledServices: {},

                /**
                * @type {ScriptInfo[]}
                */
                _allScriptTags: []
            };

            //{{START: GUI}}

            /**
             * Pointers to main dom elements
             * @type {DomElements}
             */
            this._dom = {
                _categoryCheckboxInputs: {},
                _serviceCheckboxInputs: {}
            };

            //{{END: GUI}}

            /**
             * Callback functions
             * @type {CustomCallbacks}
             */
            this._callbacks = {};

            this._customEvents = {
                _onFirstConsent: 'cc:onFirstConsent',
                _onConsent: 'cc:onConsent',
                _onChange: 'cc:onChange',
                //{{START: GUI}}
                _onModalShow: 'cc:onModalShow',
                _onModalHide: 'cc:onModalHide',
                _onModalReady: 'cc:onModalReady'
                //{{END: GUI}}
            };
        }
    }

    const globalObj = new GlobalState();

    /**
     * Helper console.log function
     * @param {Object} printMsg
     * @param {Object} [optionalParam]
     */
    const _log = (printMsg, optionalParam) => {
        console.log(printMsg, optionalParam !== undefined
            ? optionalParam
            : ' '
        );
    };

    /**
     * Helper indexOf
     * @param {any[]|string} el
     * @param {any} value
     */
    const indexOf = (el, value) => el.indexOf(value);

    /**
     * Returns true if el. (array or string) contains the specified value
     * @param {any[]|string} el
     */
    const elContains = (el, value) => indexOf(el, value) !== -1;

    const isArray = el => Array.isArray(el);

    const isString = el => typeof el === 'string';

    const isObject = el => !!el && typeof el === 'object' && !isArray(el);

    const isFunction = el => typeof el === 'function';

    const getKeys = obj => Object.keys(obj);

    /**
     * Return array without duplicates
     * @param {any[]} arr
     */
    const unique = (arr) => Array.from(new Set(arr));

    const getActiveElement = () => document.activeElement;

    /**
     * @param {Event} e
     */
    const preventDefault = (e) => e.preventDefault();

    /**
     * @param {Element} el
     * @param {string} selector
     */
    const querySelectorAll = (el, selector) => el.querySelectorAll(selector);

    /**
     * @param {HTMLInputElement} input
     */
    const dispatchInputChangeEvent = (input) => input.dispatchEvent(new Event('change'));

    /**
     * @param {keyof HTMLElementTagNameMap} type
     */
    const createNode = (type) => {
        const el = document.createElement(type);

        if (type === BUTTON_TAG) {
            el.type = type;
        }

        return el;
    };

    /**
     * @param {HTMLElement} el
     * @param {string} attribute
     * @param {string} value
     */
    const setAttribute = (el, attribute, value) => el.setAttribute(attribute, value);

    /**
     * @param {HTMLElement} el
     * @param {string} attribute
     * @param {boolean} [prependData]
     */
    const removeAttribute = (el, attribute, prependData) => {
        el.removeAttribute(prependData
            ? 'data-' + attribute
            : attribute
        );
    };

    /**
     * @param {HTMLElement} el
     * @param {string} attribute
     * @param {boolean} [prependData]
     * @returns {string}
     */
    const getAttribute = (el, attribute, prependData) => {
        return el.getAttribute(prependData
            ? 'data-' + attribute
            : attribute
        );
    };

    /**
     * @param {Node} parent
     * @param {Node} child
     */
    const appendChild = (parent, child) => parent.appendChild(child);

    /**
     * @param {HTMLElement} elem
     * @param {string} className
     */
    const addClass = (elem, className) => elem.classList.add(className);

    /**
     * @param {HTMLElement} elem
     * @param {string} id
     */
    const addId = (elem, id) => elem.id = id;

    /**
     * @param {HTMLElement} elem
     * @param {string} className
     */
    const addClassCm = (elem, className) => addClass(elem, 'cm__' + className);
    /**
     * @param {HTMLElement} elem
     * @param {string} className
     */
    const addClassPm = (elem, className) => addClass(elem, 'pm__' + className);
    /**
     * @param {HTMLElement} elem
     * @param {string} className
     */
    const addClassQrm = (elem, className) => addClass(elem, 'qrm__' + className);

    /**
     * @param {HTMLElement} elem
     * @param {string} className
     */
    const removeClass = (el, className) => el.classList.remove(className);

    /**
     * @param {HTMLElement} el
     * @param {string} className
     */
    const hasClass = (el, className) => el.classList.contains(className);

    const deepCopy = (el) => {
        if (typeof el !== 'object' )
            return el;

        if (el instanceof Date)
            return new Date(el.getTime());

        let clone = Array.isArray(el) ? [] : {};

        for (let key in el) {
            let value = el[key];
            clone[key] = deepCopy(value);
        }

        return clone;
    };

    /**
     * Store categories and services' config. details
     * @param {string[]} allCategoryNames
     */
    const fetchCategoriesAndServices = (allCategoryNames) => {
        const {
            _allDefinedCategories,
            _allDefinedServices,
            _acceptedServices,
            _enabledServices,
            _readOnlyCategories
        } = globalObj._state;

        for (let categoryName of allCategoryNames) {

            const currCategory = _allDefinedCategories[categoryName];
            const services = currCategory.services || {};
            const serviceNames = isObject(services) && getKeys(services) || [];

            _allDefinedServices[categoryName] = {};
            _acceptedServices[categoryName] = [];
            _enabledServices[categoryName] = [];

            /**
             * Keep track of readOnly categories
             */
            if (currCategory.readOnly) {
                _readOnlyCategories.push(categoryName);
                _acceptedServices[categoryName] = serviceNames;
            }

            globalObj._dom._serviceCheckboxInputs[categoryName] = {};

            for (let serviceName of serviceNames) {
                const service = services[serviceName];
                service._enabled = false;
                _allDefinedServices[categoryName][serviceName] = service;
            }
        }
    };

    /**
     * Retrieves all script elements with 'data-category' attribute
     * and save the following attributes: category-name and service
     */
    const retrieveScriptElements = () => {
        if (!globalObj._config.manageScriptTags)
            return;

        const state = globalObj._state;

        /**
         * @type {NodeListOf<HTMLScriptElement>}
         */
        const scripts = querySelectorAll(document, 'script[' + SCRIPT_TAG_SELECTOR +']');

        for (const scriptTag of scripts) {
            let scriptCategoryName = getAttribute(scriptTag, SCRIPT_TAG_SELECTOR);
            let scriptServiceName = scriptTag.dataset.service || '';
            let runOnDisable = false;

            /**
             * Remove the '!' char if it is present
             */
            if (scriptCategoryName && scriptCategoryName.charAt(0) === '!') {
                scriptCategoryName = scriptCategoryName.slice(1);
                runOnDisable = true;
            }

            if (scriptServiceName.charAt(0) === '!') {
                scriptServiceName = scriptServiceName.slice(1);
                runOnDisable = true;
            }

            if (elContains(state._allCategoryNames, scriptCategoryName)) {
                state._allScriptTags.push({
                    _script: scriptTag,
                    _executed: false,
                    _runOnDisable: runOnDisable,
                    _categoryName: scriptCategoryName,
                    _serviceName: scriptServiceName
                });

                if (scriptServiceName) {
                    const categoryServices = state._allDefinedServices[scriptCategoryName];
                    if (!categoryServices[scriptServiceName]) {
                        categoryServices[scriptServiceName] = {
                            _enabled: false
                        };
                    }
                }
            }
        }
    };

    /**
     * Calculate rejected services (all services - enabled services)
     * @returns {Object.<string, string[]>}
     */
    const retrieveRejectedServices = () => {
        const rejectedServices = {};

        const {
            _allCategoryNames,
            _allDefinedServices,
            _acceptedServices
        } = globalObj._state;

        for (const categoryName of _allCategoryNames) {
            rejectedServices[categoryName] = arrayDiff(
                _acceptedServices[categoryName],
                getKeys(_allDefinedServices[categoryName])
            );
        }

        return rejectedServices;
    };

    const retrieveCategoriesFromModal = () => {
        const toggles = globalObj._dom._categoryCheckboxInputs;

        if (!toggles)
            return [];

        let enabledCategories = [];

        for (let categoryName in toggles) {
            if (toggles[categoryName].checked) {
                enabledCategories.push(categoryName);
            }
        }

        return enabledCategories;
    };

    /**
     * @param {string[]|string} categories - Categories to accept
     * @param {string[]} [excludedCategories]
     */
    const resolveEnabledCategories = (categories, excludedCategories) => {
        const {
            _allCategoryNames,
            _acceptedCategories,
            _readOnlyCategories,
            _preferencesModalExists,
            _enabledServices,
            _allDefinedServices
        } = globalObj._state;

        /**
         * @type {string[]}
         */
        let enabledCategories = [];

        if (!categories) {
            enabledCategories = _acceptedCategories;
            //{{START: GUI}}
            _preferencesModalExists && (enabledCategories = retrieveCategoriesFromModal());
            //{{END: GUI}}
        } else {

            if (isArray(categories)) {
                enabledCategories.push(...categories);
            }else if (isString(categories)) {
                enabledCategories = categories === 'all'
                    ? _allCategoryNames
                    : [categories];
            }

            /**
             * If there are services, turn them all on or off
             */
            for (const categoryName of _allCategoryNames) {
                _enabledServices[categoryName] = elContains(enabledCategories, categoryName)
                    ? getKeys(_allDefinedServices[categoryName])
                    : [];
            }
        }

        // Remove invalid and excluded categories
        enabledCategories = enabledCategories.filter(category =>
            !elContains(_allCategoryNames, category) ||
            !elContains(excludedCategories, category)
        );

        // Add back all the categories set as "readonly/required"
        enabledCategories.push(..._readOnlyCategories);

        setAcceptedCategories(enabledCategories);
    };

    /**
     * @param {string} [relativeCategory]
     */
    const resolveEnabledServices = (relativeCategory) => {
        const state = globalObj._state;

        const {
            _enabledServices,
            _readOnlyCategories,
            _acceptedServices,
            _allDefinedServices,
            _allCategoryNames
        } = state;

        const categoriesToConsider = relativeCategory
            ? [relativeCategory]
            : _allCategoryNames;

        /**
         * Save previously enabled services to calculate later on which of them was changed
         */
        state._lastEnabledServices = deepCopy(_acceptedServices);

        for (const categoryName of categoriesToConsider) {
            const services = _allDefinedServices[categoryName];
            const serviceNames = getKeys(services);
            const customServicesSelection = _enabledServices[categoryName] && _enabledServices[categoryName].length > 0;
            const readOnlyCategory = elContains(_readOnlyCategories, categoryName);

            /**
             * Stop here if there are no services
             */
            if (serviceNames.length === 0)
                continue;

            // Empty (previously) enabled services
            _acceptedServices[categoryName] = [];

            // If category is marked as readOnly enable all its services
            if (readOnlyCategory) {
                _acceptedServices[categoryName].push(...serviceNames);
            } else {
                if (customServicesSelection) {
                    const selectedServices = _enabledServices[categoryName];
                    _acceptedServices[categoryName].push(...selectedServices);
                } else {
                    _acceptedServices[categoryName] = [];
                }
            }

            /**
             * Make sure there are no duplicates inside array
             */
            _acceptedServices[categoryName] = unique(_acceptedServices[categoryName]);
        }
    };

    /**
     * @param {string} eventName
     */
    const dispatchPluginEvent = (eventName, data) => dispatchEvent(new CustomEvent(eventName, {detail: data}));

    /**
     * Update services state internally and tick/untick checkboxes
     * @param {string|string[]} service
     * @param {string} category
     */
    const updateModalToggles = (service, category) => {
        const state = globalObj._state;
        const {
            _allDefinedServices,
            _enabledServices,
            _preferencesModalExists
        } = state;

        const servicesInputs = globalObj._dom._serviceCheckboxInputs[category] || {};
        const categoryInput = globalObj._dom._categoryCheckboxInputs[category] || {};
        const allServiceNames = getKeys(_allDefinedServices[category]);

        // Clear previously enabled services
        _enabledServices[category] = [];

        if (isString(service)) {
            if (service === 'all') {

                // Enable all services
                _enabledServices[category].push(...allServiceNames);

                if (_preferencesModalExists) {
                    for (let serviceName in servicesInputs) {
                        servicesInputs[serviceName].checked = true;
                        dispatchInputChangeEvent(servicesInputs[serviceName]);
                    }
                }

            } else {

                // Enable only one service (if valid) and disable all the others
                if (elContains(allServiceNames, service))
                    _enabledServices[category].push(service);

                if (_preferencesModalExists) {
                    for (let serviceName in servicesInputs) {
                        servicesInputs[serviceName].checked = service === serviceName;
                        dispatchInputChangeEvent(servicesInputs[serviceName]);
                    }
                }
            }
        }else if (isArray(service)) {
            for (let serviceName of allServiceNames) {
                const validService = elContains(service, serviceName);
                validService && _enabledServices[category].push(serviceName);

                if (_preferencesModalExists) {
                    servicesInputs[serviceName].checked = validService;
                    dispatchInputChangeEvent(servicesInputs[serviceName]);
                }
            }
        }

        const uncheckCategory = _enabledServices[category].length === 0;

        /**
         * Remove/add the category from acceptedCategories
         */
        state._acceptedCategories = uncheckCategory
            ? state._acceptedCategories.filter(cat => cat !== category)
            : unique([...state._acceptedCategories, category]);

        /**
         * If there are no services enabled in the
         * current category, uncheck the category
         */
        if (_preferencesModalExists) {
            categoryInput.checked = !uncheckCategory;
            dispatchInputChangeEvent(categoryInput);
        }
    };

    /**
     * Generate RFC4122-compliant UUIDs.
     * https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid?page=1&tab=votes#tab-top
     * @returns {string} unique uuid string
     */
    const uuidv4 = () => {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, (c) => {
            return (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16);
        });
    };

    /**
     * Add event listener to dom object (cross browser function)
     * @param {Element} elem
     * @param {keyof WindowEventMap} event
     * @param {EventListener} fn
     * @param {boolean} [saveListener]
     */
    const addEvent = (elem, event, fn, saveListener) => {
        elem.addEventListener(event, fn);

        /**
         * Keep track of specific event listeners
         * that must be removed on `.reset()`
         */
        if (saveListener) {
            globalObj._state._dataEventListeners.push({
                _element: elem,
                _event: event,
                _listener: fn
            });
        }
    };

    /**
     * Calculate the existing cookie's remaining time until expiration (in milliseconds)
     */
    const getRemainingExpirationTimeMS = () => {
        const lastTimestamp = globalObj._state._lastConsentTimestamp;

        const elapsedTimeMilliseconds = lastTimestamp
            ? new Date() - lastTimestamp
            : 0;

        return getExpiresAfterDaysValue()*86400000 - elapsedTimeMilliseconds;
    };

    /**
     * Used to fetch external language files (.json)
     * @param {string} url
     * @returns {Promise<import('../core/global').Translation | boolean>}
     */
    const fetchJson = async (url) => {
        try {
            const response = await fetch(url);
            return await response.json();
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    /**
     * Helper function to retrieve cookie duration
     * @returns {number}
     */
    const getExpiresAfterDaysValue = () => {
        const expiresAfterDays = globalObj._config.cookie.expiresAfterDays;

        return isFunction(expiresAfterDays)
            ? expiresAfterDays(globalObj._state._acceptType)
            : expiresAfterDays;
    };

    /**
     * Symmetric difference between 2 arrays
     * @param {any[]} arr1
     * @param {any[]} arr2
     */
    const arrayDiff = (arr1, arr2) => {
        const a = arr1 || [];
        const b = arr2 || [];

        return a
            .filter(x => !elContains(b, x))
            .concat(b.filter(x => !elContains(a, x)));
    };

    /**
     * Calculate "accept type"
     * @returns {'all'|'custom'|'necessary'} accept type
     */
    const resolveAcceptType = () => {
        let type = 'custom';

        const { _acceptedCategories, _allCategoryNames, _readOnlyCategories } = globalObj._state;
        const nAcceptedCategories = _acceptedCategories.length;

        if (nAcceptedCategories === _allCategoryNames.length)
            type = 'all';
        else if (nAcceptedCategories === _readOnlyCategories.length)
            type = 'necessary';

        return type;
    };

    /**
     * Note: getUserPreferences() depends on "acceptType"
     * @param {string[]} acceptedCategories
     */
    const setAcceptedCategories = (acceptedCategories) => {
        globalObj._state._acceptedCategories = unique(acceptedCategories);
        globalObj._state._acceptType = resolveAcceptType();
    };

    /**
     * This callback type is called `requestCallback` and is displayed as a global symbol.
     *
     * @callback createModal
     * @param {import('../core/global').Api} api
     */

    /**
     * Add an onClick listeners to all html elements with data-cc attribute
     * @param {HTMLElement} [elem]
     * @param {import('../core/global').Api} api
     * @param {createModal} [createPreferencesModal]
     */
    const addDataButtonListeners = (elem, api, createPreferencesModal, createMainContainer) => {
        const ACCEPT_PREFIX = 'accept-';

        const {
            show,
            showPreferences,
            showQr,
            hide,
            hidePreferences,
            acceptCategory
        } = api;

        const rootEl = elem || document;
        const getElements = dataRole => querySelectorAll(rootEl, `[data-cc="${dataRole}"]`);

        /**
         * Helper function: accept and then hide modals
         * @param {Event} event source event
         * @param {string|string[]} [acceptType]
         */
        const acceptAction = (event, acceptType) => {
            preventDefault(event);
            acceptCategory(acceptType);
            hidePreferences();
            hide();
        };

        const
            showPreferencesModalElements = getElements('show-preferencesModal'),
            showConsentModalElements = getElements('show-consentModal'),
            acceptAllElements = getElements(ACCEPT_PREFIX + 'all'),
            acceptNecessaryElements = getElements(ACCEPT_PREFIX + 'necessary'),
            acceptCustomElements = getElements(ACCEPT_PREFIX + 'custom'),
            createPreferencesModalOnHover = globalObj._config.lazyHtmlGeneration;

        //{{START: GUI}}
        for (const el of showPreferencesModalElements) {
            setAttribute(el, 'aria-haspopup', 'dialog');
            addEvent(el, CLICK_EVENT, (event) => {
                preventDefault(event);
                showPreferences();
            });

            if (createPreferencesModalOnHover) {
                addEvent(el, 'mouseenter', (event) => {
                    preventDefault(event);
                    if (!globalObj._state._preferencesModalExists)
                        createPreferencesModal(api, createMainContainer);
                }, true);

                addEvent(el, 'focus', () => {
                    if (!globalObj._state._preferencesModalExists)
                        createPreferencesModal(api, createMainContainer);
                });
            }
        }

        for (let el of showConsentModalElements) {
            setAttribute(el, 'aria-haspopup', 'dialog');
            addEvent(el, CLICK_EVENT, (event) => {
                preventDefault(event);
                show(true);
            }, true);
        }
        //{{END: GUI}}

        for (let el of acceptAllElements) {
            addEvent(el, CLICK_EVENT, (event) => {
                acceptAction(event, 'all');
            }, true);
        }

        for (let el of acceptCustomElements) {
            addEvent(el, CLICK_EVENT, (event) => {
                acceptAction(event);
            }, true);
        }

        for (let el of acceptNecessaryElements) {
            addEvent(el, CLICK_EVENT, (event) => {
                acceptAction(event, []);
            }, true);
        }
    };

    /**
     * @param {HTMLElement} el
     * @param {boolean} [toggleTabIndex]
     */
    const focus = (el, toggleTabIndex) => {
        if (!el) return;

        /**
         * Momentarily add the `tabindex` attribute to fix
         * a bug with focus restoration in chrome
         */
        toggleTabIndex && (el.tabIndex = -1);

        el.focus();

        /**
         * Remove the `tabindex` attribute so
         * that the html markup is valid again
         */
        toggleTabIndex && el.removeAttribute('tabindex');
    };

    /**
     * @param {HTMLDivElement} element
     * @param {1 | 2 | 3} modalId
     */
    const focusAfterTransition = (element, modalId) => {
        const getVisibleDiv = (modalId) => modalId === 1
            ? globalObj._dom._cmDivTabindex 
            : modalId === 2 ? globalObj._dom._pmDivTabindex : globalObj._dom._qrmDivTabindex;

        const setFocus = (event) => {
            event.target.removeEventListener('transitionend', setFocus);
            if (event.propertyName === 'opacity' && getComputedStyle(element).opacity === '1') {
                focus(getVisibleDiv(modalId));
            }
        };

        addEvent(element, 'transitionend', setFocus);
    };

    /**
     * Obtain accepted and rejected categories
     * @returns {{accepted: string[], rejected: string[]}}
     */
    const getCurrentCategoriesState = () => {
        const {
            _invalidConsent,
            _acceptedCategories,
            _allCategoryNames
        } = globalObj._state;

        return {
            accepted: _acceptedCategories,
            rejected: _invalidConsent
                ? []
                : _allCategoryNames.filter(category =>
                    !elContains(_acceptedCategories, category)
                )
        };
    };

    let disableInteractionTimeout;

    /**
     * @param {boolean} [enable]
     */
    const toggleDisableInteraction = (enable) => {
        clearTimeout(disableInteractionTimeout);

        if (enable) {
            addClass(globalObj._dom._htmlDom, TOGGLE_DISABLE_INTERACTION_CLASS);
        }else {
            disableInteractionTimeout = setTimeout(() => {
                removeClass(globalObj._dom._htmlDom, TOGGLE_DISABLE_INTERACTION_CLASS);
            }, 500);
        }
    };

    const iconStrokes = [
        'M 19.5 4.5 L 4.5 19.5 M 4.5 4.501 L 19.5 19.5',    // X
        'M 3.572 13.406 L 8.281 18.115 L 20.428 5.885',     // TICK
        'M 21.999 6.94 L 11.639 17.18 L 2.001 6.82 '        // ARROW
    ];

    /**
     * [0: x, 1: tick, 2: arrow]
     * @param {0 | 1 | 2} [iconIndex]
     * @param {number} [strokeWidth]
     */
    const getSvgIcon = (iconIndex = 0, strokeWidth = 1.5) => {
        return `<svg viewBox="0 0 24 24" stroke-width="${strokeWidth}"><path d="${iconStrokes[iconIndex]}"/></svg>`;
    };

    /**
     * Trap focus inside modal and focus the first
     * focusable element of current active modal
     * @param {HTMLDivElement} modal
     */
    const handleFocusTrap = (modal) => {
        const dom = globalObj._dom;
        const state = globalObj._state;

        /**
         * @param {HTMLDivElement} modal
         * @param {HTMLElement[]} focusableElements
         */
        const trapFocus = (modal) => {
            const isConsentModal = modal === dom._cm;
            const isPreferenceModal = modal === dom._pm;

            const scope = state._userConfig.disablePageInteraction
                ? dom._htmlDom
                : isConsentModal
                    ? dom._ccMain
                    : dom._htmlDom;

            const getFocusableElements = () => isConsentModal
                ? state._cmFocusableElements
                : isPreferenceModal ? state._pmFocusableElements : state._qrmFocusableElements;

            const isModalVisible = () => isConsentModal
                ? state._consentModalVisible && !state._preferencesModalVisible
                : isPreferenceModal ? state._preferencesModalVisible : state._qrModalVisible;

            addEvent(scope, 'keydown', (e) => {
                if (e.key !== 'Tab' || !isModalVisible())
                    return;

                const currentActiveElement = getActiveElement();
                const focusableElements = getFocusableElements();

                if (focusableElements.length === 0)
                    return;

                /**
                 * If reached natural end of the tab sequence => restart
                 * If current focused element is not inside modal => focus modal
                 */
                if (e.shiftKey) {
                    if (currentActiveElement === focusableElements[0] || !modal.contains(currentActiveElement)) {
                        preventDefault(e);
                        focus(focusableElements[1]);
                    }
                } else {
                    if (currentActiveElement === focusableElements[1] || !modal.contains(currentActiveElement)) {
                        preventDefault(e);
                        focus(focusableElements[0]);
                    }
                }
            }, true);
        };

        trapFocus(modal);
    };

    /**
     * Note: any of the below focusable elements, which has the attribute tabindex="-1" AND is either
     * the first or last element of the modal, won't receive focus during "open/close" modal
     */
    const focusableTypesSelector = ['[href]', BUTTON_TAG, 'input', 'details', '[tabindex]']
        .map(selector => selector+':not([tabindex="-1"])').join(',');

    const getFocusableElements = (root) => querySelectorAll(root, focusableTypesSelector);

    /**
     * Save reference to first and last focusable elements inside each modal
     * to prevent losing focus while navigating with TAB
     * @param {1 | 2 | 3} [modalId]
     */
    const getModalFocusableData = (modalId) => {
        const { _state, _dom } = globalObj;

        /**
         * Saves all focusable elements inside modal, into the array
         * @param {HTMLElement} modal
         * @param {Element[]} array
         */
        const saveAllFocusableElements = (modal, array) => {
            const focusableElements = getFocusableElements(modal);

            /**
             * Save first and last elements (trap focus inside modal)
             */
            array[0] = focusableElements[0];
            array[1] = focusableElements[focusableElements.length - 1];
        };

        if (modalId === 1 && _state._consentModalExists)
            saveAllFocusableElements(_dom._cm, _state._cmFocusableElements);

        if (modalId === 2 && _state._preferencesModalExists)
            saveAllFocusableElements(_dom._pm, _state._pmFocusableElements);

        if (modalId === 3 && _state._qrModalExists)
            saveAllFocusableElements(_dom._qrm, _state._qrmFocusableElements);
    };

    /**
     * Fire custom event
     * @param {string} eventName
     * @param {string} [modalName]
     * @param {HTMLElement} [modal]
     */
    const fireEvent = (eventName, modalName, modal) => {
        const {
            _onChange,
            _onConsent,
            _onFirstConsent,
            _onModalHide,
            _onModalReady,
            _onModalShow
        } = globalObj._callbacks;

        const events = globalObj._customEvents;

        //{{START: GUI}}
        if (modalName) {
            const modalParams = { modalName };

            if (eventName === events._onModalShow) {
                isFunction(_onModalShow) && _onModalShow(modalParams);
            }else if (eventName === events._onModalHide) {
                isFunction(_onModalHide) && _onModalHide(modalParams);
            } else {
                modalParams.modal = modal;
                isFunction(_onModalReady) && _onModalReady(modalParams);
            }

            return dispatchPluginEvent(eventName, modalParams);
        }
        //{{END: GUI}}

        const params = {
            cookie: globalObj._state._savedCookieContent
        };

        if (eventName === events._onFirstConsent) {
            isFunction(_onFirstConsent) && _onFirstConsent(deepCopy(params));
        }else if (eventName === events._onConsent) {
            isFunction(_onConsent) && _onConsent(deepCopy(params));
        }else {
            params.changedCategories = globalObj._state._lastChangedCategoryNames;
            params.changedServices = globalObj._state._lastChangedServices;
            isFunction(_onChange) && _onChange(deepCopy(params));
        }

        dispatchPluginEvent(eventName, deepCopy(params));
    };

    /**
     * @param {CallableFunction} fn
     */
    const safeRun = (fn, hideError) => {
        try {
            return fn();
        } catch (e) {
            !hideError && console.warn('CookieConsent:', e);
            return false;
        }
    };

    /**
     * @fileoverview
     * - Using the 'QRCode for Javascript library'
     * - Fixed dataset of 'QRCode for Javascript library' for support full-spec.
     * - this library has no dependencies.
     * 
     * @author davidshimjs
     * @see <a href="http://www.d-project.com/" target="_blank">http://www.d-project.com/</a>
     * @see <a href="http://jeromeetienne.github.com/jquery-qrcode/" target="_blank">http://jeromeetienne.github.com/jquery-qrcode/</a>
     */
    var QRCode;

    (function () {
    	//---------------------------------------------------------------------
    	// QRCode for JavaScript
    	//
    	// Copyright (c) 2009 Kazuhiko Arase
    	//
    	// URL: http://www.d-project.com/
    	//
    	// Licensed under the MIT license:
    	//   http://www.opensource.org/licenses/mit-license.php
    	//
    	// The word "QR Code" is registered trademark of 
    	// DENSO WAVE INCORPORATED
    	//   http://www.denso-wave.com/qrcode/faqpatent-e.html
    	//
    	//---------------------------------------------------------------------
    	function QR8bitByte(data) {
    		this.mode = QRMode.MODE_8BIT_BYTE;
    		this.data = data;
    		this.parsedData = [];

    		// Added to support UTF-8 Characters
    		for (var i = 0, l = this.data.length; i < l; i++) {
    			var byteArray = [];
    			var code = this.data.charCodeAt(i);

    			if (code > 0x10000) {
    				byteArray[0] = 0xF0 | ((code & 0x1C0000) >>> 18);
    				byteArray[1] = 0x80 | ((code & 0x3F000) >>> 12);
    				byteArray[2] = 0x80 | ((code & 0xFC0) >>> 6);
    				byteArray[3] = 0x80 | (code & 0x3F);
    			} else if (code > 0x800) {
    				byteArray[0] = 0xE0 | ((code & 0xF000) >>> 12);
    				byteArray[1] = 0x80 | ((code & 0xFC0) >>> 6);
    				byteArray[2] = 0x80 | (code & 0x3F);
    			} else if (code > 0x80) {
    				byteArray[0] = 0xC0 | ((code & 0x7C0) >>> 6);
    				byteArray[1] = 0x80 | (code & 0x3F);
    			} else {
    				byteArray[0] = code;
    			}

    			this.parsedData.push(byteArray);
    		}

    		this.parsedData = Array.prototype.concat.apply([], this.parsedData);

    		if (this.parsedData.length != this.data.length) {
    			this.parsedData.unshift(191);
    			this.parsedData.unshift(187);
    			this.parsedData.unshift(239);
    		}
    	}

    	QR8bitByte.prototype = {
    		getLength: function (buffer) {
    			return this.parsedData.length;
    		},
    		write: function (buffer) {
    			for (var i = 0, l = this.parsedData.length; i < l; i++) {
    				buffer.put(this.parsedData[i], 8);
    			}
    		}
    	};

    	function QRCodeModel(typeNumber, errorCorrectLevel) {
    		this.typeNumber = typeNumber;
    		this.errorCorrectLevel = errorCorrectLevel;
    		this.modules = null;
    		this.moduleCount = 0;
    		this.dataCache = null;
    		this.dataList = [];
    	}

    	QRCodeModel.prototype={addData:function(data){var newData=new QR8bitByte(data);this.dataList.push(newData);this.dataCache=null;},isDark:function(row,col){if(row<0||this.moduleCount<=row||col<0||this.moduleCount<=col){throw new Error(row+","+col);}
    	return this.modules[row][col];},getModuleCount:function(){return this.moduleCount;},make:function(){this.makeImpl(false,this.getBestMaskPattern());},makeImpl:function(test,maskPattern){this.moduleCount=this.typeNumber*4+17;this.modules=new Array(this.moduleCount);for(var row=0;row<this.moduleCount;row++){this.modules[row]=new Array(this.moduleCount);for(var col=0;col<this.moduleCount;col++){this.modules[row][col]=null;}}
    	this.setupPositionProbePattern(0,0);this.setupPositionProbePattern(this.moduleCount-7,0);this.setupPositionProbePattern(0,this.moduleCount-7);this.setupPositionAdjustPattern();this.setupTimingPattern();this.setupTypeInfo(test,maskPattern);if(this.typeNumber>=7){this.setupTypeNumber(test);}
    	if(this.dataCache==null){this.dataCache=QRCodeModel.createData(this.typeNumber,this.errorCorrectLevel,this.dataList);}
    	this.mapData(this.dataCache,maskPattern);},setupPositionProbePattern:function(row,col){for(var r=-1;r<=7;r++){if(row+r<=-1||this.moduleCount<=row+r)continue;for(var c=-1;c<=7;c++){if(col+c<=-1||this.moduleCount<=col+c)continue;if((0<=r&&r<=6&&(c==0||c==6))||(0<=c&&c<=6&&(r==0||r==6))||(2<=r&&r<=4&&2<=c&&c<=4)){this.modules[row+r][col+c]=true;}else {this.modules[row+r][col+c]=false;}}}},getBestMaskPattern:function(){var minLostPoint=0;var pattern=0;for(var i=0;i<8;i++){this.makeImpl(true,i);var lostPoint=QRUtil.getLostPoint(this);if(i==0||minLostPoint>lostPoint){minLostPoint=lostPoint;pattern=i;}}
    	return pattern;},createMovieClip:function(target_mc,instance_name,depth){var qr_mc=target_mc.createEmptyMovieClip(instance_name,depth);var cs=1;this.make();for(var row=0;row<this.modules.length;row++){var y=row*cs;for(var col=0;col<this.modules[row].length;col++){var x=col*cs;var dark=this.modules[row][col];if(dark){qr_mc.beginFill(0,100);qr_mc.moveTo(x,y);qr_mc.lineTo(x+cs,y);qr_mc.lineTo(x+cs,y+cs);qr_mc.lineTo(x,y+cs);qr_mc.endFill();}}}
    	return qr_mc;},setupTimingPattern:function(){for(var r=8;r<this.moduleCount-8;r++){if(this.modules[r][6]!=null){continue;}
    	this.modules[r][6]=(r%2==0);}
    	for(var c=8;c<this.moduleCount-8;c++){if(this.modules[6][c]!=null){continue;}
    	this.modules[6][c]=(c%2==0);}},setupPositionAdjustPattern:function(){var pos=QRUtil.getPatternPosition(this.typeNumber);for(var i=0;i<pos.length;i++){for(var j=0;j<pos.length;j++){var row=pos[i];var col=pos[j];if(this.modules[row][col]!=null){continue;}
    	for(var r=-2;r<=2;r++){for(var c=-2;c<=2;c++){if(r==-2||r==2||c==-2||c==2||(r==0&&c==0)){this.modules[row+r][col+c]=true;}else {this.modules[row+r][col+c]=false;}}}}}},setupTypeNumber:function(test){var bits=QRUtil.getBCHTypeNumber(this.typeNumber);for(var i=0;i<18;i++){var mod=(!test&&((bits>>i)&1)==1);this.modules[Math.floor(i/3)][i%3+this.moduleCount-8-3]=mod;}
    	for(var i=0;i<18;i++){var mod=(!test&&((bits>>i)&1)==1);this.modules[i%3+this.moduleCount-8-3][Math.floor(i/3)]=mod;}},setupTypeInfo:function(test,maskPattern){var data=(this.errorCorrectLevel<<3)|maskPattern;var bits=QRUtil.getBCHTypeInfo(data);for(var i=0;i<15;i++){var mod=(!test&&((bits>>i)&1)==1);if(i<6){this.modules[i][8]=mod;}else if(i<8){this.modules[i+1][8]=mod;}else {this.modules[this.moduleCount-15+i][8]=mod;}}
    	for(var i=0;i<15;i++){var mod=(!test&&((bits>>i)&1)==1);if(i<8){this.modules[8][this.moduleCount-i-1]=mod;}else if(i<9){this.modules[8][15-i-1+1]=mod;}else {this.modules[8][15-i-1]=mod;}}
    	this.modules[this.moduleCount-8][8]=(!test);},mapData:function(data,maskPattern){var inc=-1;var row=this.moduleCount-1;var bitIndex=7;var byteIndex=0;for(var col=this.moduleCount-1;col>0;col-=2){if(col==6)col--;while(true){for(var c=0;c<2;c++){if(this.modules[row][col-c]==null){var dark=false;if(byteIndex<data.length){dark=(((data[byteIndex]>>>bitIndex)&1)==1);}
    	var mask=QRUtil.getMask(maskPattern,row,col-c);if(mask){dark=!dark;}
    	this.modules[row][col-c]=dark;bitIndex--;if(bitIndex==-1){byteIndex++;bitIndex=7;}}}
    	row+=inc;if(row<0||this.moduleCount<=row){row-=inc;inc=-inc;break;}}}}};QRCodeModel.PAD0=0xEC;QRCodeModel.PAD1=0x11;QRCodeModel.createData=function(typeNumber,errorCorrectLevel,dataList){var rsBlocks=QRRSBlock.getRSBlocks(typeNumber,errorCorrectLevel);var buffer=new QRBitBuffer();for(var i=0;i<dataList.length;i++){var data=dataList[i];buffer.put(data.mode,4);buffer.put(data.getLength(),QRUtil.getLengthInBits(data.mode,typeNumber));data.write(buffer);}
    	var totalDataCount=0;for(var i=0;i<rsBlocks.length;i++){totalDataCount+=rsBlocks[i].dataCount;}
    	if(buffer.getLengthInBits()>totalDataCount*8){throw new Error("code length overflow. ("
    	+buffer.getLengthInBits()
    	+">"
    	+totalDataCount*8
    	+")");}
    	if(buffer.getLengthInBits()+4<=totalDataCount*8){buffer.put(0,4);}
    	while(buffer.getLengthInBits()%8!=0){buffer.putBit(false);}
    	while(true){if(buffer.getLengthInBits()>=totalDataCount*8){break;}
    	buffer.put(QRCodeModel.PAD0,8);if(buffer.getLengthInBits()>=totalDataCount*8){break;}
    	buffer.put(QRCodeModel.PAD1,8);}
    	return QRCodeModel.createBytes(buffer,rsBlocks);};QRCodeModel.createBytes=function(buffer,rsBlocks){var offset=0;var maxDcCount=0;var maxEcCount=0;var dcdata=new Array(rsBlocks.length);var ecdata=new Array(rsBlocks.length);for(var r=0;r<rsBlocks.length;r++){var dcCount=rsBlocks[r].dataCount;var ecCount=rsBlocks[r].totalCount-dcCount;maxDcCount=Math.max(maxDcCount,dcCount);maxEcCount=Math.max(maxEcCount,ecCount);dcdata[r]=new Array(dcCount);for(var i=0;i<dcdata[r].length;i++){dcdata[r][i]=0xff&buffer.buffer[i+offset];}
    	offset+=dcCount;var rsPoly=QRUtil.getErrorCorrectPolynomial(ecCount);var rawPoly=new QRPolynomial(dcdata[r],rsPoly.getLength()-1);var modPoly=rawPoly.mod(rsPoly);ecdata[r]=new Array(rsPoly.getLength()-1);for(var i=0;i<ecdata[r].length;i++){var modIndex=i+modPoly.getLength()-ecdata[r].length;ecdata[r][i]=(modIndex>=0)?modPoly.get(modIndex):0;}}
    	var totalCodeCount=0;for(var i=0;i<rsBlocks.length;i++){totalCodeCount+=rsBlocks[i].totalCount;}
    	var data=new Array(totalCodeCount);var index=0;for(var i=0;i<maxDcCount;i++){for(var r=0;r<rsBlocks.length;r++){if(i<dcdata[r].length){data[index++]=dcdata[r][i];}}}
    	for(var i=0;i<maxEcCount;i++){for(var r=0;r<rsBlocks.length;r++){if(i<ecdata[r].length){data[index++]=ecdata[r][i];}}}
    	return data;};var QRMode={MODE_NUMBER:1<<0,MODE_ALPHA_NUM:1<<1,MODE_8BIT_BYTE:1<<2,MODE_KANJI:1<<3};var QRErrorCorrectLevel={L:1,M:0,Q:3,H:2};var QRMaskPattern={PATTERN000:0,PATTERN001:1,PATTERN010:2,PATTERN011:3,PATTERN100:4,PATTERN101:5,PATTERN110:6,PATTERN111:7};var QRUtil={PATTERN_POSITION_TABLE:[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],[6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]],G15:(1<<10)|(1<<8)|(1<<5)|(1<<4)|(1<<2)|(1<<1)|(1<<0),G18:(1<<12)|(1<<11)|(1<<10)|(1<<9)|(1<<8)|(1<<5)|(1<<2)|(1<<0),G15_MASK:(1<<14)|(1<<12)|(1<<10)|(1<<4)|(1<<1),getBCHTypeInfo:function(data){var d=data<<10;while(QRUtil.getBCHDigit(d)-QRUtil.getBCHDigit(QRUtil.G15)>=0){d^=(QRUtil.G15<<(QRUtil.getBCHDigit(d)-QRUtil.getBCHDigit(QRUtil.G15)));}
    	return ((data<<10)|d)^QRUtil.G15_MASK;},getBCHTypeNumber:function(data){var d=data<<12;while(QRUtil.getBCHDigit(d)-QRUtil.getBCHDigit(QRUtil.G18)>=0){d^=(QRUtil.G18<<(QRUtil.getBCHDigit(d)-QRUtil.getBCHDigit(QRUtil.G18)));}
    	return (data<<12)|d;},getBCHDigit:function(data){var digit=0;while(data!=0){digit++;data>>>=1;}
    	return digit;},getPatternPosition:function(typeNumber){return QRUtil.PATTERN_POSITION_TABLE[typeNumber-1];},getMask:function(maskPattern,i,j){switch(maskPattern){case QRMaskPattern.PATTERN000:return (i+j)%2==0;case QRMaskPattern.PATTERN001:return i%2==0;case QRMaskPattern.PATTERN010:return j%3==0;case QRMaskPattern.PATTERN011:return (i+j)%3==0;case QRMaskPattern.PATTERN100:return (Math.floor(i/2)+Math.floor(j/3))%2==0;case QRMaskPattern.PATTERN101:return (i*j)%2+(i*j)%3==0;case QRMaskPattern.PATTERN110:return ((i*j)%2+(i*j)%3)%2==0;case QRMaskPattern.PATTERN111:return ((i*j)%3+(i+j)%2)%2==0;default:throw new Error("bad maskPattern:"+maskPattern);}},getErrorCorrectPolynomial:function(errorCorrectLength){var a=new QRPolynomial([1],0);for(var i=0;i<errorCorrectLength;i++){a=a.multiply(new QRPolynomial([1,QRMath.gexp(i)],0));}
    	return a;},getLengthInBits:function(mode,type){if(1<=type&&type<10){switch(mode){case QRMode.MODE_NUMBER:return 10;case QRMode.MODE_ALPHA_NUM:return 9;case QRMode.MODE_8BIT_BYTE:return 8;case QRMode.MODE_KANJI:return 8;default:throw new Error("mode:"+mode);}}else if(type<27){switch(mode){case QRMode.MODE_NUMBER:return 12;case QRMode.MODE_ALPHA_NUM:return 11;case QRMode.MODE_8BIT_BYTE:return 16;case QRMode.MODE_KANJI:return 10;default:throw new Error("mode:"+mode);}}else if(type<41){switch(mode){case QRMode.MODE_NUMBER:return 14;case QRMode.MODE_ALPHA_NUM:return 13;case QRMode.MODE_8BIT_BYTE:return 16;case QRMode.MODE_KANJI:return 12;default:throw new Error("mode:"+mode);}}else {throw new Error("type:"+type);}},getLostPoint:function(qrCode){var moduleCount=qrCode.getModuleCount();var lostPoint=0;for(var row=0;row<moduleCount;row++){for(var col=0;col<moduleCount;col++){var sameCount=0;var dark=qrCode.isDark(row,col);for(var r=-1;r<=1;r++){if(row+r<0||moduleCount<=row+r){continue;}
    	for(var c=-1;c<=1;c++){if(col+c<0||moduleCount<=col+c){continue;}
    	if(r==0&&c==0){continue;}
    	if(dark==qrCode.isDark(row+r,col+c)){sameCount++;}}}
    	if(sameCount>5){lostPoint+=(3+sameCount-5);}}}
    	for(var row=0;row<moduleCount-1;row++){for(var col=0;col<moduleCount-1;col++){var count=0;if(qrCode.isDark(row,col))count++;if(qrCode.isDark(row+1,col))count++;if(qrCode.isDark(row,col+1))count++;if(qrCode.isDark(row+1,col+1))count++;if(count==0||count==4){lostPoint+=3;}}}
    	for(var row=0;row<moduleCount;row++){for(var col=0;col<moduleCount-6;col++){if(qrCode.isDark(row,col)&&!qrCode.isDark(row,col+1)&&qrCode.isDark(row,col+2)&&qrCode.isDark(row,col+3)&&qrCode.isDark(row,col+4)&&!qrCode.isDark(row,col+5)&&qrCode.isDark(row,col+6)){lostPoint+=40;}}}
    	for(var col=0;col<moduleCount;col++){for(var row=0;row<moduleCount-6;row++){if(qrCode.isDark(row,col)&&!qrCode.isDark(row+1,col)&&qrCode.isDark(row+2,col)&&qrCode.isDark(row+3,col)&&qrCode.isDark(row+4,col)&&!qrCode.isDark(row+5,col)&&qrCode.isDark(row+6,col)){lostPoint+=40;}}}
    	var darkCount=0;for(var col=0;col<moduleCount;col++){for(var row=0;row<moduleCount;row++){if(qrCode.isDark(row,col)){darkCount++;}}}
    	var ratio=Math.abs(100*darkCount/moduleCount/moduleCount-50)/5;lostPoint+=ratio*10;return lostPoint;}};var QRMath={glog:function(n){if(n<1){throw new Error("glog("+n+")");}
    	return QRMath.LOG_TABLE[n];},gexp:function(n){while(n<0){n+=255;}
    	while(n>=256){n-=255;}
    	return QRMath.EXP_TABLE[n];},EXP_TABLE:new Array(256),LOG_TABLE:new Array(256)};for(var i=0;i<8;i++){QRMath.EXP_TABLE[i]=1<<i;}
    	for(var i=8;i<256;i++){QRMath.EXP_TABLE[i]=QRMath.EXP_TABLE[i-4]^QRMath.EXP_TABLE[i-5]^QRMath.EXP_TABLE[i-6]^QRMath.EXP_TABLE[i-8];}
    	for(var i=0;i<255;i++){QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]]=i;}
    	function QRPolynomial(num,shift){if(num.length==undefined){throw new Error(num.length+"/"+shift);}
    	var offset=0;while(offset<num.length&&num[offset]==0){offset++;}
    	this.num=new Array(num.length-offset+shift);for(var i=0;i<num.length-offset;i++){this.num[i]=num[i+offset];}}
    	QRPolynomial.prototype={get:function(index){return this.num[index];},getLength:function(){return this.num.length;},multiply:function(e){var num=new Array(this.getLength()+e.getLength()-1);for(var i=0;i<this.getLength();i++){for(var j=0;j<e.getLength();j++){num[i+j]^=QRMath.gexp(QRMath.glog(this.get(i))+QRMath.glog(e.get(j)));}}
    	return new QRPolynomial(num,0);},mod:function(e){if(this.getLength()-e.getLength()<0){return this;}
    	var ratio=QRMath.glog(this.get(0))-QRMath.glog(e.get(0));var num=new Array(this.getLength());for(var i=0;i<this.getLength();i++){num[i]=this.get(i);}
    	for(var i=0;i<e.getLength();i++){num[i]^=QRMath.gexp(QRMath.glog(e.get(i))+ratio);}
    	return new QRPolynomial(num,0).mod(e);}};function QRRSBlock(totalCount,dataCount){this.totalCount=totalCount;this.dataCount=dataCount;}
    	QRRSBlock.RS_BLOCK_TABLE=[[1,26,19],[1,26,16],[1,26,13],[1,26,9],[1,44,34],[1,44,28],[1,44,22],[1,44,16],[1,70,55],[1,70,44],[2,35,17],[2,35,13],[1,100,80],[2,50,32],[2,50,24],[4,25,9],[1,134,108],[2,67,43],[2,33,15,2,34,16],[2,33,11,2,34,12],[2,86,68],[4,43,27],[4,43,19],[4,43,15],[2,98,78],[4,49,31],[2,32,14,4,33,15],[4,39,13,1,40,14],[2,121,97],[2,60,38,2,61,39],[4,40,18,2,41,19],[4,40,14,2,41,15],[2,146,116],[3,58,36,2,59,37],[4,36,16,4,37,17],[4,36,12,4,37,13],[2,86,68,2,87,69],[4,69,43,1,70,44],[6,43,19,2,44,20],[6,43,15,2,44,16],[4,101,81],[1,80,50,4,81,51],[4,50,22,4,51,23],[3,36,12,8,37,13],[2,116,92,2,117,93],[6,58,36,2,59,37],[4,46,20,6,47,21],[7,42,14,4,43,15],[4,133,107],[8,59,37,1,60,38],[8,44,20,4,45,21],[12,33,11,4,34,12],[3,145,115,1,146,116],[4,64,40,5,65,41],[11,36,16,5,37,17],[11,36,12,5,37,13],[5,109,87,1,110,88],[5,65,41,5,66,42],[5,54,24,7,55,25],[11,36,12],[5,122,98,1,123,99],[7,73,45,3,74,46],[15,43,19,2,44,20],[3,45,15,13,46,16],[1,135,107,5,136,108],[10,74,46,1,75,47],[1,50,22,15,51,23],[2,42,14,17,43,15],[5,150,120,1,151,121],[9,69,43,4,70,44],[17,50,22,1,51,23],[2,42,14,19,43,15],[3,141,113,4,142,114],[3,70,44,11,71,45],[17,47,21,4,48,22],[9,39,13,16,40,14],[3,135,107,5,136,108],[3,67,41,13,68,42],[15,54,24,5,55,25],[15,43,15,10,44,16],[4,144,116,4,145,117],[17,68,42],[17,50,22,6,51,23],[19,46,16,6,47,17],[2,139,111,7,140,112],[17,74,46],[7,54,24,16,55,25],[34,37,13],[4,151,121,5,152,122],[4,75,47,14,76,48],[11,54,24,14,55,25],[16,45,15,14,46,16],[6,147,117,4,148,118],[6,73,45,14,74,46],[11,54,24,16,55,25],[30,46,16,2,47,17],[8,132,106,4,133,107],[8,75,47,13,76,48],[7,54,24,22,55,25],[22,45,15,13,46,16],[10,142,114,2,143,115],[19,74,46,4,75,47],[28,50,22,6,51,23],[33,46,16,4,47,17],[8,152,122,4,153,123],[22,73,45,3,74,46],[8,53,23,26,54,24],[12,45,15,28,46,16],[3,147,117,10,148,118],[3,73,45,23,74,46],[4,54,24,31,55,25],[11,45,15,31,46,16],[7,146,116,7,147,117],[21,73,45,7,74,46],[1,53,23,37,54,24],[19,45,15,26,46,16],[5,145,115,10,146,116],[19,75,47,10,76,48],[15,54,24,25,55,25],[23,45,15,25,46,16],[13,145,115,3,146,116],[2,74,46,29,75,47],[42,54,24,1,55,25],[23,45,15,28,46,16],[17,145,115],[10,74,46,23,75,47],[10,54,24,35,55,25],[19,45,15,35,46,16],[17,145,115,1,146,116],[14,74,46,21,75,47],[29,54,24,19,55,25],[11,45,15,46,46,16],[13,145,115,6,146,116],[14,74,46,23,75,47],[44,54,24,7,55,25],[59,46,16,1,47,17],[12,151,121,7,152,122],[12,75,47,26,76,48],[39,54,24,14,55,25],[22,45,15,41,46,16],[6,151,121,14,152,122],[6,75,47,34,76,48],[46,54,24,10,55,25],[2,45,15,64,46,16],[17,152,122,4,153,123],[29,74,46,14,75,47],[49,54,24,10,55,25],[24,45,15,46,46,16],[4,152,122,18,153,123],[13,74,46,32,75,47],[48,54,24,14,55,25],[42,45,15,32,46,16],[20,147,117,4,148,118],[40,75,47,7,76,48],[43,54,24,22,55,25],[10,45,15,67,46,16],[19,148,118,6,149,119],[18,75,47,31,76,48],[34,54,24,34,55,25],[20,45,15,61,46,16]];QRRSBlock.getRSBlocks=function(typeNumber,errorCorrectLevel){var rsBlock=QRRSBlock.getRsBlockTable(typeNumber,errorCorrectLevel);if(rsBlock==undefined){throw new Error("bad rs block @ typeNumber:"+typeNumber+"/errorCorrectLevel:"+errorCorrectLevel);}
    	var length=rsBlock.length/3;var list=[];for(var i=0;i<length;i++){var count=rsBlock[i*3+0];var totalCount=rsBlock[i*3+1];var dataCount=rsBlock[i*3+2];for(var j=0;j<count;j++){list.push(new QRRSBlock(totalCount,dataCount));}}
    	return list;};QRRSBlock.getRsBlockTable=function(typeNumber,errorCorrectLevel){switch(errorCorrectLevel){case QRErrorCorrectLevel.L:return QRRSBlock.RS_BLOCK_TABLE[(typeNumber-1)*4+0];case QRErrorCorrectLevel.M:return QRRSBlock.RS_BLOCK_TABLE[(typeNumber-1)*4+1];case QRErrorCorrectLevel.Q:return QRRSBlock.RS_BLOCK_TABLE[(typeNumber-1)*4+2];case QRErrorCorrectLevel.H:return QRRSBlock.RS_BLOCK_TABLE[(typeNumber-1)*4+3];default:return undefined;}};function QRBitBuffer(){this.buffer=[];this.length=0;}
    	QRBitBuffer.prototype={get:function(index){var bufIndex=Math.floor(index/8);return ((this.buffer[bufIndex]>>>(7-index%8))&1)==1;},put:function(num,length){for(var i=0;i<length;i++){this.putBit(((num>>>(length-i-1))&1)==1);}},getLengthInBits:function(){return this.length;},putBit:function(bit){var bufIndex=Math.floor(this.length/8);if(this.buffer.length<=bufIndex){this.buffer.push(0);}
    	if(bit){this.buffer[bufIndex]|=(0x80>>>(this.length%8));}
    	this.length++;}};var QRCodeLimitLength=[[17,14,11,7],[32,26,20,14],[53,42,32,24],[78,62,46,34],[106,84,60,44],[134,106,74,58],[154,122,86,64],[192,152,108,84],[230,180,130,98],[271,213,151,119],[321,251,177,137],[367,287,203,155],[425,331,241,177],[458,362,258,194],[520,412,292,220],[586,450,322,250],[644,504,364,280],[718,560,394,310],[792,624,442,338],[858,666,482,382],[929,711,509,403],[1003,779,565,439],[1091,857,611,461],[1171,911,661,511],[1273,997,715,535],[1367,1059,751,593],[1465,1125,805,625],[1528,1190,868,658],[1628,1264,908,698],[1732,1370,982,742],[1840,1452,1030,790],[1952,1538,1112,842],[2068,1628,1168,898],[2188,1722,1228,958],[2303,1809,1283,983],[2431,1911,1351,1051],[2563,1989,1423,1093],[2699,2099,1499,1139],[2809,2213,1579,1219],[2953,2331,1663,1273]];
    	
    	function _isSupportCanvas() {
    		return typeof CanvasRenderingContext2D != "undefined";
    	}
    	
    	// android 2.x doesn't support Data-URI spec
    	function _getAndroid() {
    		var android = false;
    		var sAgent = navigator.userAgent;
    		
    		if (/android/i.test(sAgent)) { // android
    			android = true;
    			var aMat = sAgent.toString().match(/android ([0-9]\.[0-9])/i);
    			
    			if (aMat && aMat[1]) {
    				android = parseFloat(aMat[1]);
    			}
    		}
    		
    		return android;
    	}
    	
    	var svgDrawer = (function() {

    		var Drawing = function (el, htOption) {
    			this._el = el;
    			this._htOption = htOption;
    		};

    		Drawing.prototype.draw = function (oQRCode) {
    			var _htOption = this._htOption;
    			var _el = this._el;
    			var nCount = oQRCode.getModuleCount();
    			Math.floor(_htOption.width / nCount);
    			Math.floor(_htOption.height / nCount);

    			this.clear();

    			function makeSVG(tag, attrs) {
    				var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    				for (var k in attrs)
    					if (attrs.hasOwnProperty(k)) el.setAttribute(k, attrs[k]);
    				return el;
    			}

    			var svg = makeSVG("svg" , {'viewBox': '0 0 ' + String(nCount) + " " + String(nCount), 'width': '100%', 'height': '100%', 'fill': _htOption.colorLight});
    			svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
    			_el.appendChild(svg);

    			svg.appendChild(makeSVG("rect", {"fill": _htOption.colorLight, "width": "100%", "height": "100%"}));
    			svg.appendChild(makeSVG("rect", {"fill": _htOption.colorDark, "width": "1", "height": "1", "id": "template"}));

    			for (var row = 0; row < nCount; row++) {
    				for (var col = 0; col < nCount; col++) {
    					if (oQRCode.isDark(row, col)) {
    						var child = makeSVG("use", {"x": String(col), "y": String(row)});
    						child.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#template");
    						svg.appendChild(child);
    					}
    				}
    			}
    		};
    		Drawing.prototype.clear = function () {
    			while (this._el.hasChildNodes())
    				this._el.removeChild(this._el.lastChild);
    		};
    		return Drawing;
    	})();

    	var useSVG = document.documentElement.tagName.toLowerCase() === "svg";

    	// Drawing in DOM by using Table tag
    	var Drawing = useSVG ? svgDrawer : !_isSupportCanvas() ? (function () {
    		var Drawing = function (el, htOption) {
    			this._el = el;
    			this._htOption = htOption;
    		};
    			
    		/**
    		 * Draw the QRCode
    		 * 
    		 * @param {QRCode} oQRCode
    		 */
    		Drawing.prototype.draw = function (oQRCode) {
                var _htOption = this._htOption;
                var _el = this._el;
    			var nCount = oQRCode.getModuleCount();
    			var nWidth = Math.floor(_htOption.width / nCount);
    			var nHeight = Math.floor(_htOption.height / nCount);
    			var aHTML = ['<table style="border:0;border-collapse:collapse;">'];
    			
    			for (var row = 0; row < nCount; row++) {
    				aHTML.push('<tr>');
    				
    				for (var col = 0; col < nCount; col++) {
    					aHTML.push('<td style="border:0;border-collapse:collapse;padding:0;margin:0;width:' + nWidth + 'px;height:' + nHeight + 'px;background-color:' + (oQRCode.isDark(row, col) ? _htOption.colorDark : _htOption.colorLight) + ';"></td>');
    				}
    				
    				aHTML.push('</tr>');
    			}
    			
    			aHTML.push('</table>');
    			_el.innerHTML = aHTML.join('');
    			
    			// Fix the margin values as real size.
    			var elTable = _el.childNodes[0];
    			var nLeftMarginTable = (_htOption.width - elTable.offsetWidth) / 2;
    			var nTopMarginTable = (_htOption.height - elTable.offsetHeight) / 2;
    			
    			if (nLeftMarginTable > 0 && nTopMarginTable > 0) {
    				elTable.style.margin = nTopMarginTable + "px " + nLeftMarginTable + "px";	
    			}
    		};
    		
    		/**
    		 * Clear the QRCode
    		 */
    		Drawing.prototype.clear = function () {
    			this._el.innerHTML = '';
    		};
    		
    		return Drawing;
    	})() : (function () { // Drawing in Canvas
    		function _onMakeImage() {
    			this._elImage.src = this._elCanvas.toDataURL("image/png");
    			this._elImage.style.display = "block";
    			this._elCanvas.style.display = "none";			
    		}
    		
    		// Android 2.1 bug workaround
    		// http://code.google.com/p/android/issues/detail?id=5141
    		/*if (this._android && this._android <= 2.1) {
    	    	var factor = 1 / window.devicePixelRatio;
    	        var drawImage = CanvasRenderingContext2D.prototype.drawImage; 
    	    	CanvasRenderingContext2D.prototype.drawImage = function (image, sx, sy, sw, sh, dx, dy, dw, dh) {
    	    		if (("nodeName" in image) && /img/i.test(image.nodeName)) {
    		        	for (var i = arguments.length - 1; i >= 1; i--) {
    		            	arguments[i] = arguments[i] * factor;
    		        	}
    	    		} else if (typeof dw == "undefined") {
    	    			arguments[1] *= factor;
    	    			arguments[2] *= factor;
    	    			arguments[3] *= factor;
    	    			arguments[4] *= factor;
    	    		}
    	    		
    	        	drawImage.apply(this, arguments); 
    	    	};
    		}*/
    		
    		/**
    		 * Check whether the user's browser supports Data URI or not
    		 * 
    		 * @private
    		 * @param {Function} fSuccess Occurs if it supports Data URI
    		 * @param {Function} fFail Occurs if it doesn't support Data URI
    		 */
    		function _safeSetDataURI(fSuccess, fFail) {
                var self = this;
                self._fFail = fFail;
                self._fSuccess = fSuccess;

                // Check it just once
                if (self._bSupportDataURI === null) {
                    var el = document.createElement("img");
                    var fOnError = function() {
                        self._bSupportDataURI = false;

                        if (self._fFail) {
                            self._fFail.call(self);
                        }
                    };
                    var fOnSuccess = function() {
                        self._bSupportDataURI = true;

                        if (self._fSuccess) {
                            self._fSuccess.call(self);
                        }
                    };

                    el.onabort = fOnError;
                    el.onerror = fOnError;
                    el.onload = fOnSuccess;
                    el.src = "data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="; // the Image contains 1px data.
                    return;
                } else if (self._bSupportDataURI === true && self._fSuccess) {
                    self._fSuccess.call(self);
                } else if (self._bSupportDataURI === false && self._fFail) {
                    self._fFail.call(self);
                }
    		}		
    		/**
    		 * Drawing QRCode by using canvas
    		 * 
    		 * @constructor
    		 * @param {HTMLElement} el
    		 * @param {Object} htOption QRCode Options 
    		 */
    		var Drawing = function (el, htOption) {
        		this._bIsPainted = false;
        		this._android = _getAndroid();
    		
    			this._htOption = htOption;
    			this._elCanvas = document.createElement("canvas");
    			this._elCanvas.width = htOption.width;
    			this._elCanvas.height = htOption.height;
    			el.appendChild(this._elCanvas);
    			this._el = el;
    			this._oContext = this._elCanvas.getContext("2d");
    			this._bIsPainted = false;
    			this._elImage = document.createElement("img");
    			this._elImage.alt = "Scan me!";
    			this._elImage.style.display = "none";
    			this._el.appendChild(this._elImage);
    			this._bSupportDataURI = null;
    		};
    			
    		/**
    		 * Draw the QRCode
    		 * 
    		 * @param {QRCode} oQRCode 
    		 */
    		Drawing.prototype.draw = function (oQRCode) {
                var _elImage = this._elImage;
                var _oContext = this._oContext;
                var _htOption = this._htOption;
                
    			var nCount = oQRCode.getModuleCount();
    			var nWidth = _htOption.width / nCount;
    			var nHeight = _htOption.height / nCount;
    			var nRoundedWidth = Math.round(nWidth);
    			var nRoundedHeight = Math.round(nHeight);

    			_elImage.style.display = "none";
    			this.clear();
    			
    			for (var row = 0; row < nCount; row++) {
    				for (var col = 0; col < nCount; col++) {
    					var bIsDark = oQRCode.isDark(row, col);
    					var nLeft = col * nWidth;
    					var nTop = row * nHeight;
    					_oContext.strokeStyle = bIsDark ? _htOption.colorDark : _htOption.colorLight;
    					_oContext.lineWidth = 1;
    					_oContext.fillStyle = bIsDark ? _htOption.colorDark : _htOption.colorLight;					
    					_oContext.fillRect(nLeft, nTop, nWidth, nHeight);
    					
    					// 안티 앨리어싱 방지 처리
    					_oContext.strokeRect(
    						Math.floor(nLeft) + 0.5,
    						Math.floor(nTop) + 0.5,
    						nRoundedWidth,
    						nRoundedHeight
    					);
    					
    					_oContext.strokeRect(
    						Math.ceil(nLeft) - 0.5,
    						Math.ceil(nTop) - 0.5,
    						nRoundedWidth,
    						nRoundedHeight
    					);
    				}
    			}
    			
    			this._bIsPainted = true;
    		};
    			
    		/**
    		 * Make the image from Canvas if the browser supports Data URI.
    		 */
    		Drawing.prototype.makeImage = function () {
    			if (this._bIsPainted) {
    				_safeSetDataURI.call(this, _onMakeImage);
    			}
    		};
    			
    		/**
    		 * Return whether the QRCode is painted or not
    		 * 
    		 * @return {Boolean}
    		 */
    		Drawing.prototype.isPainted = function () {
    			return this._bIsPainted;
    		};
    		
    		/**
    		 * Clear the QRCode
    		 */
    		Drawing.prototype.clear = function () {
    			this._oContext.clearRect(0, 0, this._elCanvas.width, this._elCanvas.height);
    			this._bIsPainted = false;
    		};
    		
    		/**
    		 * @private
    		 * @param {Number} nNumber
    		 */
    		Drawing.prototype.round = function (nNumber) {
    			if (!nNumber) {
    				return nNumber;
    			}
    			
    			return Math.floor(nNumber * 1000) / 1000;
    		};
    		
    		return Drawing;
    	})();
    	
    	/**
    	 * Get the type by string length
    	 * 
    	 * @private
    	 * @param {String} sText
    	 * @param {Number} nCorrectLevel
    	 * @return {Number} type
    	 */
    	function _getTypeNumber(sText, nCorrectLevel) {			
    		var nType = 1;
    		var length = _getUTF8Length(sText);
    		
    		for (var i = 0, len = QRCodeLimitLength.length; i <= len; i++) {
    			var nLimit = 0;
    			
    			switch (nCorrectLevel) {
    				case QRErrorCorrectLevel.L :
    					nLimit = QRCodeLimitLength[i][0];
    					break;
    				case QRErrorCorrectLevel.M :
    					nLimit = QRCodeLimitLength[i][1];
    					break;
    				case QRErrorCorrectLevel.Q :
    					nLimit = QRCodeLimitLength[i][2];
    					break;
    				case QRErrorCorrectLevel.H :
    					nLimit = QRCodeLimitLength[i][3];
    					break;
    			}
    			
    			if (length <= nLimit) {
    				break;
    			} else {
    				nType++;
    			}
    		}
    		
    		if (nType > QRCodeLimitLength.length) {
    			throw new Error("Too long data");
    		}
    		
    		return nType;
    	}

    	function _getUTF8Length(sText) {
    		var replacedText = encodeURI(sText).toString().replace(/\%[0-9a-fA-F]{2}/g, 'a');
    		return replacedText.length + (replacedText.length != sText ? 3 : 0);
    	}
    	
    	/**
    	 * @class QRCode
    	 * @constructor
    	 * @example 
    	 * new QRCode(document.getElementById("test"), "http://jindo.dev.naver.com/collie");
    	 *
    	 * @example
    	 * var oQRCode = new QRCode("test", {
    	 *    text : "http://naver.com",
    	 *    width : 128,
    	 *    height : 128
    	 * });
    	 * 
    	 * oQRCode.clear(); // Clear the QRCode.
    	 * oQRCode.makeCode("http://map.naver.com"); // Re-create the QRCode.
    	 *
    	 * @param {HTMLElement|String} el target element or 'id' attribute of element.
    	 * @param {Object|String} vOption
    	 * @param {String} vOption.text QRCode link data
    	 * @param {Number} [vOption.width=256]
    	 * @param {Number} [vOption.height=256]
    	 * @param {String} [vOption.colorDark="#000000"]
    	 * @param {String} [vOption.colorLight="#ffffff"]
    	 * @param {QRCode.CorrectLevel} [vOption.correctLevel=QRCode.CorrectLevel.H] [L|M|Q|H] 
    	 */
    	QRCode = function (el, vOption) {
    		this._htOption = {
    			width : 256, 
    			height : 256,
    			typeNumber : 4,
    			colorDark : "#000000",
    			colorLight : "#ffffff",
    			correctLevel : QRErrorCorrectLevel.H
    		};
    		
    		if (typeof vOption === 'string') {
    			vOption	= {
    				text : vOption
    			};
    		}
    		
    		// Overwrites options
    		if (vOption) {
    			for (var i in vOption) {
    				this._htOption[i] = vOption[i];
    			}
    		}
    		
    		if (typeof el == "string") {
    			el = document.getElementById(el);
    		}

    		if (this._htOption.useSVG) {
    			Drawing = svgDrawer;
    		}
    		
    		this._android = _getAndroid();
    		this._el = el;
    		this._oQRCode = null;
    		this._oDrawing = new Drawing(this._el, this._htOption);
    		
    		if (this._htOption.text) {
    			this.makeCode(this._htOption.text);	
    		}
    	};
    	
    	/**
    	 * Make the QRCode
    	 * 
    	 * @param {String} sText link data
    	 */
    	QRCode.prototype.makeCode = function (sText) {
    		this._oQRCode = new QRCodeModel(_getTypeNumber(sText, this._htOption.correctLevel), this._htOption.correctLevel);
    		this._oQRCode.addData(sText);
    		this._oQRCode.make();
    		this._el.title = sText;
    		this._oDrawing.draw(this._oQRCode);			
    		this.makeImage();
    	};
    	
    	/**
    	 * Make the Image from Canvas element
    	 * - It occurs automatically
    	 * - Android below 3 doesn't support Data-URI spec.
    	 * 
    	 * @private
    	 */
    	QRCode.prototype.makeImage = function () {
    		if (typeof this._oDrawing.makeImage == "function" && (!this._android || this._android >= 3)) {
    			this._oDrawing.makeImage();
    		}
    	};
    	
    	/**
    	 * Clear the QRCode
    	 */
    	QRCode.prototype.clear = function () {
    		this._oDrawing.clear();
    	};
    	
    	/**
    	 * @name QRCode.CorrectLevel
    	 */
    	QRCode.CorrectLevel = QRErrorCorrectLevel;
    })();

    /**
     * @param {string} type
     */
    const validMimeType = type => ['text/javascript', 'module'].includes(type);

    /**
     * This function handles the loading/activation logic of the already
     * existing scripts based on the current accepted cookie categories
     *
     * @param {string[]} [defaultEnabledCategories]
     */
    const manageExistingScripts = (defaultEnabledCategories) => {
        const {
            _acceptedServices,
            _lastChangedServices,
            _allCategoryNames,
            _allDefinedServices,
            _allScriptTags,
            _savedCookieContent,
            _lastChangedCategoryNames,
        } = globalObj._state;

        /**
         * Automatically Enable/Disable internal services
         */
        for (const categoryName of _allCategoryNames) {
            const lastChangedServices = _lastChangedServices[categoryName]
                || _acceptedServices[categoryName]
                || [];

            for (const serviceName of lastChangedServices) {
                const service = _allDefinedServices[categoryName][serviceName];

                if (!service)
                    continue;

                const {onAccept, onReject} = service;

                if (
                    !service._enabled
                    && elContains(_acceptedServices[categoryName], serviceName)
                    && isFunction(onAccept)
                ) {
                    service._enabled = true;
                    onAccept();
                }

                else if (
                    service._enabled
                    && !elContains(_acceptedServices[categoryName], serviceName)
                    && isFunction(onReject)
                ) {
                    service._enabled = false;
                    onReject();
                }
            }
        }

        if (!globalObj._config.manageScriptTags)
            return;

        const scripts = _allScriptTags;
        const acceptedCategories = defaultEnabledCategories
            || _savedCookieContent.categories
            || [];

        /**
         * Load scripts (sequentially), using a recursive function
         * which loops through the scripts array
         * @param {import('../core/global').ScriptInfo[]} scripts scripts to load
         * @param {number} index current script to load
         */
        const loadScriptsHelper = (scripts, index) => {
            if (index >= scripts.length)
                return;

            const currScriptInfo = _allScriptTags[index];

            /**
             * Skip script if it was already executed
             */
            if (currScriptInfo._executed)
                return loadScriptsHelper(scripts, index+1);

            const currScript = currScriptInfo._script;
            const currScriptCategory = currScriptInfo._categoryName;
            const currScriptService = currScriptInfo._serviceName;
            const categoryAccepted = elContains(acceptedCategories, currScriptCategory);
            const serviceAccepted = currScriptService
                ? elContains(_acceptedServices[currScriptCategory], currScriptService)
                : false;

            const categoryWasJustEnabled = () => !currScriptService
                && !currScriptInfo._runOnDisable
                && categoryAccepted;

            const serviceWasJustEnabled = () => currScriptService
                && !currScriptInfo._runOnDisable
                && serviceAccepted;

            const categoryWasJustDisabled = () => !currScriptService
                && currScriptInfo._runOnDisable
                && !categoryAccepted
                && elContains(_lastChangedCategoryNames, currScriptCategory);

            const serviceWasJustDisabled = () => currScriptService
                && currScriptInfo._runOnDisable
                && !serviceAccepted
                && elContains(_lastChangedServices[currScriptCategory] || [], currScriptService);

            const shouldRunScript =
                categoryWasJustEnabled()
                || categoryWasJustDisabled()
                || serviceWasJustEnabled()
                || serviceWasJustDisabled();

            if (shouldRunScript) {
                currScriptInfo._executed = true;
                const dataType = getAttribute(currScript, 'type', true);

                removeAttribute(currScript, 'type', !!dataType);
                removeAttribute(currScript, SCRIPT_TAG_SELECTOR);

                // Get current script data-src (if there is one)
                let src = getAttribute(currScript, 'src', true);

                // Some scripts (like ga) might throw warning if data-src is present
                src && removeAttribute(currScript, 'src', true);

                /**
                 * Fresh script
                 * @type {HTMLScriptElement}
                 */
                const freshScript = createNode('script');

                freshScript.textContent = currScript.innerHTML;

                //Copy attributes over to the new "revived" script
                for (const {nodeName} of currScript.attributes) {
                    setAttribute(
                        freshScript,
                        nodeName,
                        currScript[nodeName] || getAttribute(currScript, nodeName)
                    );
                }

                /**
                 * Set custom type
                 */
                dataType && (freshScript.type = dataType);

                // Set src (if data-src found)
                src
                    ? (freshScript.src = src)
                    : (src = currScript.src);

                const externalScript = !!src && (dataType ? validMimeType(dataType) : true);

                // If script has valid "src" attribute
                // try loading it sequentially
                if (externalScript) {
                    // load script sequentially => the next script will not be loaded
                    // until the current's script onload event triggers
                    freshScript.onload = freshScript.onerror = () => {
                        loadScriptsHelper(scripts, ++index);
                    };
                }

                // Replace current "sleeping" script with the new "revived" one
                currScript.replaceWith(freshScript);

                /**
                 * If we managed to get here and src is still set, it means that
                 * the script is loading/loaded sequentially so don't go any further
                 */
                if (externalScript)
                    return;
            }


            // Go to next script right away
            loadScriptsHelper(scripts, ++index);
        };

        loadScriptsHelper(scripts, 0);
    };

    /**
     * Keep track of categories enabled by default (useful when mode==OPT_OUT_MODE)
     */
    const retrieveEnabledCategoriesAndServices = () => {
        const state = globalObj._state;

        for (const categoryName of state._allCategoryNames) {
            const category = state._allDefinedCategories[categoryName];

            if (category.readOnly || (category.enabled && state._userConfig.mode === OPT_OUT_MODE)) {
                state._defaultEnabledCategories.push(categoryName);
                const services = state._allDefinedServices[categoryName] || {};

                for (let serviceName in services) {
                    state._acceptedServices[categoryName].push(serviceName);
                }
            }
        }
    };

    /**
     * @typedef {Object} Layout
     * @property {string[]} _variants
     * @property {string[]} _alignV
     * @property {string[]} _alignH
     * @property {string} _defaultAlignV
     * @property {string} _defaultAlignH
     */

    /**
     * @typedef {Object.<string, Layout>} Layouts
     */

    const CLASS_CONSTANTS = {
        _top: 'top',
        _middle: 'middle',
        _bottom: 'bottom',
        _left: 'left',
        _center: 'center',
        _right: 'right',
        _inline: 'inline',
        _wide: 'wide',
        _pmPrefix: 'pm--',
        _cmPrefix: 'cm--',
        _qrmPrefix: 'qrm--',
        _box: 'box'
    };

    const alignV = [
        CLASS_CONSTANTS._middle,
        CLASS_CONSTANTS._top,
        CLASS_CONSTANTS._bottom
    ];

    const alignH = [
        CLASS_CONSTANTS._left,
        CLASS_CONSTANTS._center,
        CLASS_CONSTANTS._right
    ];

    const ALL_CM_LAYOUTS = {
        box: {
            _variants: [CLASS_CONSTANTS._wide, CLASS_CONSTANTS._inline],
            _alignV: alignV,
            _alignH: alignH,
            _defaultAlignV: CLASS_CONSTANTS._bottom,
            _defaultAlignH: CLASS_CONSTANTS._right
        },
        cloud: {
            _variants: [CLASS_CONSTANTS._inline],
            _alignV: alignV,
            _alignH: alignH,
            _defaultAlignV: CLASS_CONSTANTS._bottom,
            _defaultAlignH: CLASS_CONSTANTS._center
        },
        bar: {
            _variants: [CLASS_CONSTANTS._inline],
            _alignV: alignV.slice(1),   //remove the first "middle" option
            _alignH: [],
            _defaultAlignV: CLASS_CONSTANTS._bottom,
            _defaultAlignH: ''
        }
    };

    const ALL_PM_LAYOUTS = {
        box: {
            _variants: [],
            _alignV: [],
            _alignH: [],
            _defaultAlignV: '',
            _defaultAlignH: ''
        },
        bar: {
            _variants: [CLASS_CONSTANTS._wide],
            _alignV: [],
            _alignH: [CLASS_CONSTANTS._left, CLASS_CONSTANTS._right],
            _defaultAlignV: '',
            _defaultAlignH: CLASS_CONSTANTS._left
        }
    };

    /**
     * Add appropriate classes to modals and buttons
     * @param {0 | 1 | 2} applyToModal
     */
    const guiManager = (applyToModal) => {
        const guiOptions = globalObj._state._userConfig.guiOptions;
        const consentModalOptions = guiOptions && guiOptions.consentModal;
        const preferencesModalOptions = guiOptions && guiOptions.preferencesModal;

        if (applyToModal === 0) {
            setLayout(
                globalObj._dom._cm,
                ALL_CM_LAYOUTS,
                consentModalOptions,
                CLASS_CONSTANTS._cmPrefix,
                CLASS_CONSTANTS._box,
                'cm'
            );
        }

        if (applyToModal === 1) {
            setLayout(
                globalObj._dom._pm,
                ALL_PM_LAYOUTS,
                preferencesModalOptions,
                CLASS_CONSTANTS._pmPrefix,
                CLASS_CONSTANTS._box,
                'pm'
            );
        }

        if (applyToModal === 2) {
            setLayout(
                globalObj._dom._qrm,
                ALL_PM_LAYOUTS,
                preferencesModalOptions,
                CLASS_CONSTANTS._qrmPrefix,
                CLASS_CONSTANTS._box,
                'qrm'
            );
        }
    };

    /**
     * Helper function to set the proper layout classes
     * @param {HTMLElement} modal
     * @param {Layouts} allowedLayoutsObj
     * @param {import("../core/global").GuiModalOption} userGuiOptions
     * @param {'cm--' | 'pm--'} modalClassPrefix
     * @param {string} defaultLayoutName
     * @param {'cm' | 'pm'} modalClassName
     */
    const setLayout = (modal, allowedLayoutsObj, userGuiOptions, modalClassPrefix, defaultLayoutName, modalClassName) => {
        /**
         * Reset modal classes to default
         */
        modal.className = modalClassName;

        const layout = userGuiOptions && userGuiOptions.layout;
        const position = userGuiOptions && userGuiOptions.position;
        const flipButtons = userGuiOptions && userGuiOptions.flipButtons;
        const equalWeightButtons = !userGuiOptions || userGuiOptions.equalWeightButtons !== false;

        const layoutSplit = layout && layout.split(' ') || [];

        const layoutName = layoutSplit[0];
        const layoutVariant = layoutSplit[1];

        const currentLayoutName = layoutName in allowedLayoutsObj
            ? layoutName
            : defaultLayoutName;

        const currentLayout = allowedLayoutsObj[currentLayoutName];
        const currentLayoutVariant = elContains(currentLayout._variants, layoutVariant) && layoutVariant;

        const positionSplit = position && position.split(' ') || [];
        const positionV = positionSplit[0];

        const positionH = modalClassPrefix === CLASS_CONSTANTS._pmPrefix
            ? positionSplit[0]
            : positionSplit[1];

        const currentPositionV = elContains(currentLayout._alignV, positionV)
            ? positionV
            : currentLayout._defaultAlignV;

        const currentPositionH = elContains(currentLayout._alignH, positionH)
            ? positionH
            : currentLayout._defaultAlignH;

        const addModalClass = className => {
            className && addClass(modal, modalClassPrefix + className);
        };

        addModalClass(currentLayoutName);
        addModalClass(currentLayoutVariant);
        addModalClass(currentPositionV);
        addModalClass(currentPositionH);
        flipButtons && addModalClass('flip');

        const secondaryBtnClass = 'btn--secondary';
        const btnClassPrefix = modalClassName + '__';
        const btnClass = btnClassPrefix + secondaryBtnClass;

        /**
         * Add classes to buttons
         */
        if (modalClassName === 'cm') {
            const {_cmAcceptNecessaryBtn, _cmCloseIconBtn} = globalObj._dom;

            if (_cmAcceptNecessaryBtn) {
                equalWeightButtons
                    ? removeClass(_cmAcceptNecessaryBtn, btnClass)
                    : addClass(_cmAcceptNecessaryBtn, btnClass);
            }

            if (_cmCloseIconBtn) {
                equalWeightButtons
                    ? removeClass(_cmCloseIconBtn, btnClass)
                    : addClass(_cmCloseIconBtn, btnClass);
            }
        } else {
            const { _pmAcceptNecessaryBtn } =  globalObj._dom;

            if (_pmAcceptNecessaryBtn) {
                equalWeightButtons
                    ? removeClass(_pmAcceptNecessaryBtn, btnClass)
                    : addClass(_pmAcceptNecessaryBtn, btnClass);
            }
        }
    };

    /**
     * @callback CreateMainContainer
     */

    /**
     * Generates preferences modal and appends it to "cc-main" el.
     * @param {import("../global").Api} api
     * @param {CreateMainContainer} createMainContainer
     */
    const createPreferencesModal = (api, createMainContainer) => {
        const state = globalObj._state;
        const dom = globalObj._dom;
        const {hide, hidePreferences, acceptCategory} = api;

        /**
         * @param {string|string[]} [categories]
         */
        const acceptHelper = (categories) => {
            acceptCategory(categories);
            hidePreferences();
            hide();
        };

        /**
         * @type {import("../global").PreferencesModalOptions}
         */
        const modalData = state._currentTranslation && state._currentTranslation.preferencesModal;

        if (!modalData)
            return;

        const
            titleData = modalData.title,
            closeIconLabelData = modalData.closeIconLabel,
            acceptAllBtnData = modalData.acceptAllBtn,
            acceptNecessaryBtnData = modalData.acceptNecessaryBtn,
            savePreferencesBtnData = modalData.savePreferencesBtn,
            sectionsData = modalData.sections || [],
            createFooter = acceptAllBtnData
                || acceptNecessaryBtnData
                || savePreferencesBtnData;

        if (!dom._pmContainer) {
            dom._pmContainer = createNode(DIV_TAG);
            addClass(dom._pmContainer, 'pm-wrapper');

            const pmOverlay = createNode('div');
            addClass(pmOverlay, 'pm-overlay');
            appendChild(dom._pmContainer, pmOverlay);

            /**
             * Hide modal when overlay is clicked
             */
            addEvent(pmOverlay, CLICK_EVENT, hidePreferences);

            // Preferences modal
            dom._pm = createNode(DIV_TAG);

            addClass(dom._pm, 'pm');
            setAttribute(dom._pm, 'role', 'dialog');
            setAttribute(dom._pm, ARIA_HIDDEN, true);
            setAttribute(dom._pm, 'aria-modal', true);
            setAttribute(dom._pm, 'aria-labelledby', 'pm__title');

            // Hide preferences on 'esc' key press
            addEvent(dom._htmlDom, 'keydown', (event) => {
                if (event.keyCode === 27)
                    hidePreferences();
            }, true);

            dom._pmHeader = createNode(DIV_TAG);
            addClassPm(dom._pmHeader, 'header');

            dom._pmTitle = createNode('h2');
            addClassPm(dom._pmTitle, 'title');
            dom._pmTitle.id = 'pm__title';

            dom._pmCloseBtn = createNode(BUTTON_TAG);
            addClassPm(dom._pmCloseBtn, 'close-btn');
            setAttribute(dom._pmCloseBtn, 'aria-label', modalData.closeIconLabel || '');
            addEvent(dom._pmCloseBtn, CLICK_EVENT, hidePreferences);

            dom._pmFocusSpan = createNode('span');
            dom._pmFocusSpan.innerHTML = getSvgIcon();
            appendChild(dom._pmCloseBtn, dom._pmFocusSpan);

            dom._pmBody = createNode(DIV_TAG);
            addClassPm(dom._pmBody, 'body');

            dom._pmFooter = createNode(DIV_TAG);
            addClassPm(dom._pmFooter, 'footer');

            var _pmBtnContainer = createNode(DIV_TAG);
            addClass(_pmBtnContainer, 'btns');

            var _pmBtnGroup1 = createNode(DIV_TAG);
            var _pmBtnGroup2 = createNode(DIV_TAG);
            addClassPm(_pmBtnGroup1, BTN_GROUP_CLASS);
            addClassPm(_pmBtnGroup2, BTN_GROUP_CLASS);

            appendChild(dom._pmFooter, _pmBtnGroup1);
            appendChild(dom._pmFooter, _pmBtnGroup2);

            appendChild(dom._pmHeader, dom._pmTitle);
            appendChild(dom._pmHeader, dom._pmCloseBtn);

            dom._pmDivTabindex = createNode(DIV_TAG);
            setAttribute(dom._pmDivTabindex, 'tabIndex', -1);
            appendChild(dom._pm, dom._pmDivTabindex);

            appendChild(dom._pm, dom._pmHeader);
            appendChild(dom._pm, dom._pmBody);

            createFooter && appendChild(dom._pm, dom._pmFooter);

            appendChild(dom._pmContainer, dom._pm);
        } else {
            dom._pmNewBody = createNode(DIV_TAG);
            addClassPm(dom._pmNewBody, 'body');
        }

        if (titleData) {
            dom._pmTitle.innerHTML = titleData;
            closeIconLabelData && setAttribute(dom._pmCloseBtn, 'aria-label', closeIconLabelData);
        }

        let sectionToggleContainer;

        sectionsData.forEach((section, sectionIndex) => {
            const
                sTitleData = section.title,
                sDescriptionData = section.description,
                sLinkedCategory = section.linkedCategory,
                sCurrentCategoryObject = sLinkedCategory && state._allDefinedCategories[sLinkedCategory],
                sCookieTableData = section.cookieTable,
                sCookieTableBody = sCookieTableData && sCookieTableData.body,
                sCookieTableCaption = sCookieTableData && sCookieTableData.caption,
                sCreateCookieTable = sCookieTableBody && sCookieTableBody.length > 0,
                hasToggle = !!sCurrentCategoryObject,

                /**
                 * @type {Object.<string, import('../global').Service>}
                 */
                sServices = hasToggle && state._allDefinedServices[sLinkedCategory],
                sServiceNames = isObject(sServices) && getKeys(sServices) || [],
                sIsExpandableToggle = hasToggle && (!!sDescriptionData || !!sCreateCookieTable || getKeys(sServices).length>0);


            // section
            var s = createNode(DIV_TAG);
            addClassPm(s, 'section');

            if (sIsExpandableToggle || sDescriptionData) {
                var sDescContainer = createNode(DIV_TAG);
                addClassPm(sDescContainer, 'section-desc-wrapper');
            }

            let nServices = sServiceNames.length;

            if (sIsExpandableToggle) {
                if (nServices > 0) {

                    const servicesContainer = createNode(DIV_TAG);
                    addClassPm(servicesContainer, 'section-services');

                    for (const serviceName of sServiceNames) {
                        const service = sServices[serviceName];
                        const serviceLabel = service && service.label || serviceName;
                        const serviceDiv = createNode(DIV_TAG);
                        const serviceHeader = createNode(DIV_TAG);
                        const serviceIconContainer = createNode(DIV_TAG);
                        const serviceTitle = createNode(DIV_TAG);

                        addClassPm(serviceDiv, 'service');
                        addClassPm(serviceTitle, 'service-title');
                        addClassPm(serviceHeader, 'service-header');
                        addClassPm(serviceIconContainer, 'service-icon');

                        const toggleLabel = createToggleLabel(serviceLabel, serviceName, sCurrentCategoryObject, true, sLinkedCategory);

                        serviceTitle.innerHTML = serviceLabel;

                        appendChild(serviceHeader, serviceIconContainer);
                        appendChild(serviceHeader, serviceTitle);
                        appendChild(serviceDiv, serviceHeader);
                        appendChild(serviceDiv, toggleLabel);
                        appendChild(servicesContainer, serviceDiv);
                    }

                    appendChild(sDescContainer, servicesContainer);
                }
            }

            if (sTitleData) {
                var sTitleContainer = createNode(DIV_TAG);

                var sTitle = hasToggle
                    ? createNode(BUTTON_TAG)
                    : createNode(DIV_TAG);

                addClassPm(sTitleContainer, 'section-title-wrapper');
                addClassPm(sTitle, 'section-title');

                sTitle.innerHTML = sTitleData;
                appendChild(sTitleContainer, sTitle);

                if (hasToggle) {

                    /**
                     * Arrow icon span
                     */
                    const sTitleIcon = createNode('span');
                    sTitleIcon.innerHTML = getSvgIcon(2, 3.5);
                    addClassPm(sTitleIcon, 'section-arrow');
                    appendChild(sTitleContainer, sTitleIcon);

                    s.className += '--toggle';

                    const toggleLabel = createToggleLabel(sTitleData, sLinkedCategory, sCurrentCategoryObject);

                    let serviceCounterLabel = modalData.serviceCounterLabel;

                    if (nServices > 0 && isString(serviceCounterLabel)) {
                        let serviceCounter = createNode('span');

                        addClassPm(serviceCounter, 'badge');
                        addClassPm(serviceCounter, 'service-counter');
                        setAttribute(serviceCounter, ARIA_HIDDEN, true);
                        setAttribute(serviceCounter, 'data-servicecounter', nServices);

                        if (serviceCounterLabel) {
                            serviceCounterLabel = serviceCounterLabel.split('|');

                            if (serviceCounterLabel.length > 1 && nServices > 1)
                                serviceCounterLabel = serviceCounterLabel[1];
                            else
                                serviceCounterLabel = serviceCounterLabel[0];

                            setAttribute(serviceCounter, 'data-counterlabel', serviceCounterLabel);
                        }

                        serviceCounter.innerHTML = nServices + (serviceCounterLabel
                            ? ' ' + serviceCounterLabel
                            : '');

                        appendChild(sTitle, serviceCounter);
                    }

                    if (sIsExpandableToggle) {
                        addClassPm(s, 'section--expandable');
                        var expandableDivId = sLinkedCategory + '-desc';
                        setAttribute(sTitle, 'aria-expanded', false);
                        setAttribute(sTitle, 'aria-controls', expandableDivId);
                    }

                    appendChild(sTitleContainer, toggleLabel);

                } else {
                    setAttribute(sTitle, 'role', 'heading');
                    setAttribute(sTitle, 'aria-level', '3');
                }

                appendChild(s, sTitleContainer);
            }

            if (sDescriptionData) {
                var sDesc = createNode('p');
                addClassPm(sDesc, 'section-desc');
                sDesc.innerHTML = sDescriptionData;
                appendChild(sDescContainer, sDesc);
            }

            if (sIsExpandableToggle) {
                setAttribute(sDescContainer, ARIA_HIDDEN, 'true');
                sDescContainer.id = expandableDivId;

                /**
                 * On button click handle the following :=> aria-expanded, aria-hidden and act class for current section
                 */
                ((accordion, section, btn) => {
                    addEvent(sTitle, CLICK_EVENT, () => {
                        if (!hasClass(section, 'is-expanded')) {
                            addClass(section, 'is-expanded');
                            setAttribute(btn, 'aria-expanded', 'true');
                            setAttribute(accordion, ARIA_HIDDEN, 'false');
                        } else {
                            removeClass(section, 'is-expanded');
                            setAttribute(btn, 'aria-expanded', 'false');
                            setAttribute(accordion, ARIA_HIDDEN, 'true');
                        }
                    });
                })(sDescContainer, s, sTitle);


                if (sCreateCookieTable) {
                    const table = createNode('table');
                    const thead = createNode('thead');
                    const tbody = createNode('tbody');

                    if (sCookieTableCaption) {
                        const caption = createNode('caption');
                        addClassPm(caption, 'table-caption');
                        caption.innerHTML = sCookieTableCaption;
                        table.appendChild(caption);
                    }

                    addClassPm(table, 'section-table');
                    addClassPm(thead, 'table-head');
                    addClassPm(tbody, 'table-body');

                    const headerData = sCookieTableData.headers;
                    const tableHeadersKeys = getKeys(headerData);

                    /**
                     * Create table headers
                     */
                    const trHeadFragment = dom._document.createDocumentFragment();
                    const trHead = createNode('tr');

                    for (const headerKey of tableHeadersKeys) {
                        const headerValue = headerData[headerKey];
                        const th = createNode('th');

                        th.id = 'cc__row-' + headerValue + sectionIndex;
                        setAttribute(th, 'scope', 'col');
                        addClassPm(th, 'table-th');

                        th.innerHTML = headerValue;
                        appendChild(trHeadFragment, th);
                    }

                    appendChild(trHead, trHeadFragment);
                    appendChild(thead, trHead);

                    /**
                     * Create table body
                     */
                    const bodyFragment = dom._document.createDocumentFragment();

                    for (const bodyItem of sCookieTableBody) {
                        const tr = createNode('tr');
                        addClassPm(tr, 'table-tr');

                        for (const tdKey of tableHeadersKeys) {
                            const tdHeader = headerData[tdKey];
                            const tdValue = bodyItem[tdKey];

                            const td = createNode('td');
                            const tdInner = createNode(DIV_TAG);

                            addClassPm(td, 'table-td');
                            setAttribute(td, 'data-column', tdHeader);
                            setAttribute(td, 'headers', 'cc__row-' + tdHeader + sectionIndex);

                            tdInner.insertAdjacentHTML('beforeend', tdValue);

                            appendChild(td, tdInner);
                            appendChild(tr, td);
                        }

                        appendChild(bodyFragment, tr);
                    }

                    appendChild(tbody, bodyFragment);
                    appendChild(table, thead);
                    appendChild(table, tbody);
                    appendChild(sDescContainer, table);
                }
            }

            if (sIsExpandableToggle || sDescriptionData)
                appendChild(s, sDescContainer);

            const currentBody = dom._pmNewBody || dom._pmBody;

            if (hasToggle) {
                if (!sectionToggleContainer) {
                    sectionToggleContainer = createNode(DIV_TAG);
                    addClassPm(sectionToggleContainer, 'section-toggles');
                }
                sectionToggleContainer.appendChild(s);
            } else {
                sectionToggleContainer = null;
            }

            appendChild(currentBody, sectionToggleContainer || s);

        });

        if (acceptAllBtnData) {
            if (!dom._pmAcceptAllBtn) {
                dom._pmAcceptAllBtn = createNode(BUTTON_TAG);
                addClassPm(dom._pmAcceptAllBtn, 'btn');
                setAttribute(dom._pmAcceptAllBtn, DATA_ROLE, 'all');
                appendChild(_pmBtnGroup1, dom._pmAcceptAllBtn);
                addEvent(dom._pmAcceptAllBtn, CLICK_EVENT, () =>
                    acceptHelper('all')
                );
            }

            dom._pmAcceptAllBtn.innerHTML = acceptAllBtnData;
        }

        if (acceptNecessaryBtnData) {
            if (!dom._pmAcceptNecessaryBtn) {
                dom._pmAcceptNecessaryBtn = createNode(BUTTON_TAG);
                addClassPm(dom._pmAcceptNecessaryBtn, 'btn');
                setAttribute(dom._pmAcceptNecessaryBtn, DATA_ROLE, 'necessary');
                appendChild(_pmBtnGroup1, dom._pmAcceptNecessaryBtn);
                addEvent(dom._pmAcceptNecessaryBtn, CLICK_EVENT, () =>
                    acceptHelper([])
                );
            }

            dom._pmAcceptNecessaryBtn.innerHTML = acceptNecessaryBtnData;
        }

        if (savePreferencesBtnData) {
            if (!dom._pmSavePreferencesBtn) {
                dom._pmSavePreferencesBtn = createNode(BUTTON_TAG);
                addClassPm(dom._pmSavePreferencesBtn, 'btn');
                addClassPm(dom._pmSavePreferencesBtn, 'btn--secondary');
                setAttribute(dom._pmSavePreferencesBtn, DATA_ROLE, 'save');
                appendChild(_pmBtnGroup2, dom._pmSavePreferencesBtn);

                addEvent(dom._pmSavePreferencesBtn, CLICK_EVENT, () =>
                    acceptHelper()
                );
            }

            dom._pmSavePreferencesBtn.innerHTML = savePreferencesBtnData;
        }

        if (dom._pmNewBody) {
            dom._pm.replaceChild(dom._pmNewBody, dom._pmBody);
            dom._pmBody = dom._pmNewBody;
        }

        guiManager(1);

        if (!state._preferencesModalExists) {
            state._preferencesModalExists = true;

            _log('CookieConsent [HTML] created', PREFERENCES_MODAL_NAME);

            fireEvent(globalObj._customEvents._onModalReady, PREFERENCES_MODAL_NAME, dom._pm);
            createMainContainer(api);
            appendChild(dom._ccMain, dom._pmContainer);
            handleFocusTrap(dom._pm);

            /**
             * Enable transition
             */
            setTimeout(() => addClass(dom._pmContainer, 'cc--anim'), 100);
        }

        getModalFocusableData(2);
    };

    /**
     * Generate toggle
     * @param {string} label block title
     * @param {string} value category/service
     * @param {import('../global').Category} sCurrentCategoryObject
     * @param {boolean} [isService]
     * @param {string} categoryName
     */
    function createToggleLabel(label, value, sCurrentCategoryObject, isService, categoryName) {
        const state = globalObj._state;
        const dom = globalObj._dom;

        /** @type {HTMLLabelElement} */ const toggleLabel = createNode('label');
        /** @type {HTMLInputElement} */ const toggle = createNode('input');
        /** @type {HTMLSpanElement} */  const toggleIcon = createNode('span');
        /** @type {HTMLSpanElement} */  const toggleIconCircle = createNode('span');
        /** @type {HTMLSpanElement} */  const toggleLabelSpan = createNode('span');

        // each will contain 2 pseudo-elements to generate 'tick' and 'x' icons
        /** @type {HTMLSpanElement} */  const toggleOnIcon = createNode('span');
        /** @type {HTMLSpanElement} */  const toggleOffIcon = createNode('span');

        toggleOnIcon.innerHTML = getSvgIcon(1, 3);
        toggleOffIcon.innerHTML = getSvgIcon(0, 3);

        toggle.type = 'checkbox';

        addClass(toggleLabel, 'section__toggle-wrapper');
        addClass(toggle, 'section__toggle');
        addClass(toggleOnIcon, 'toggle__icon-on');
        addClass(toggleOffIcon, 'toggle__icon-off');
        addClass(toggleIcon, 'toggle__icon');
        addClass(toggleIconCircle, 'toggle__icon-circle');
        addClass(toggleLabelSpan, 'toggle__label');

        setAttribute(toggleIcon, ARIA_HIDDEN, 'true');

        if (isService) {
            addClass(toggleLabel, 'toggle-service');
            setAttribute(toggle, SCRIPT_TAG_SELECTOR, categoryName);

            // Save reference to toggles to avoid using document.querySelector later on
            dom._serviceCheckboxInputs[categoryName][value] = toggle;
        } else {
            dom._categoryCheckboxInputs[value] = toggle;
        }

        if (!isService) {
            ((value)=> {
                addEvent(toggle, CLICK_EVENT, () => {
                    const categoryServicesToggles = dom._serviceCheckboxInputs[value];
                    const checked = toggle.checked;
                    state._enabledServices[value] = [];

                    /**
                     * Enable/disable all services
                     */
                    for (let serviceName in categoryServicesToggles) {
                        categoryServicesToggles[serviceName].checked = checked;
                        checked && state._enabledServices[value].push(serviceName);
                    }
                });
            })(value);
        } else {
            ((categoryName) => {
                addEvent(toggle, 'change', () => {
                    const categoryServicesToggles = dom._serviceCheckboxInputs[categoryName];
                    const categoryToggle = dom._categoryCheckboxInputs[categoryName];

                    state._enabledServices[categoryName] = [];

                    for (let serviceName in categoryServicesToggles) {
                        const serviceInput = categoryServicesToggles[serviceName];

                        if (serviceInput.checked) {
                            state._enabledServices[categoryName].push(serviceInput.value);
                        }
                    }

                    categoryToggle.checked = state._enabledServices[categoryName].length > 0;
                });
            })(categoryName);

        }

        toggle.value = value;
        toggleLabelSpan.textContent = label.replace(/<.*>.*<\/.*>/gm, '');

        appendChild(toggleIconCircle, toggleOffIcon);
        appendChild(toggleIconCircle, toggleOnIcon);
        appendChild(toggleIcon, toggleIconCircle);

        /**
         * If consent is valid => retrieve category states from cookie
         * Otherwise use states defined in the userConfig. object
         */
        if (!state._invalidConsent) {
            if (isService) {
                const enabledServices = state._acceptedServices[categoryName];
                toggle.checked = sCurrentCategoryObject.readOnly || elContains(enabledServices, value);
            }else if (elContains(state._acceptedCategories, value)) {
                toggle.checked = true;
            }
        }else if (sCurrentCategoryObject.readOnly || sCurrentCategoryObject.enabled) {
            toggle.checked = true;
        }

        /**
         * Set toggle as readonly if true (disable checkbox)
         */
        if (sCurrentCategoryObject.readOnly) {
            toggle.disabled = true;
        }

        appendChild(toggleLabel, toggle);
        appendChild(toggleLabel, toggleIcon);
        appendChild(toggleLabel, toggleLabelSpan);

        return toggleLabel;
    }

    /**
     * @callback CreateMainContainer
     */

    /**
     * @returns {HTMLSpanElement}
     */
    /*const createFocusSpan = () => {
        const span = createNode('span');

        if (!globalObj._dom._focusSpan)
            globalObj._dom._focusSpan = span;

        return span;
    };*/

    /**
     * Create qr modal and append it to "cc-main" el.
     * @param {import("../global").Api} api
     * @param {CreateMainContainer} createMainContainer
     */
    const createQRModal = (api, createMainContainer) => {
        const state = globalObj._state;
        const dom = globalObj._dom;
        const {hide} = api;


        /**
         * @type {import("../global").ConsentModalOptions}
         */
        const consentModalData = {
            acceptAllBtn: 'Use 360ofme',
            acceptNecessaryBtn: '',
            description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip.',
            footer: '<a href="#link">Privacy Policy</a>\n<a href="#link">Terms and conditions</a>',
            showPreferencesBtn: '',
            title: 'Hello kike, it\'s cookie time!'
        };

        //if (!consentModalData)
        //    return;

        console.log('la data del QR modal:', consentModalData);
        const closeIconLabelData = consentModalData.closeIconLabel,
            consentModalLabelValue = consentModalData.label,
            consentModalTitleValue = consentModalData.title;

        /**
         * @param {string|string[]} [categories]
         */
        const acceptAndHide = (categories) => {
            hide();
            //acceptCategory(categories);
        };

        // Create modal if it doesn't exist
        console.log('kike check si cmContainer exist:', dom._qrmContainer);
        if (!dom._qrmContainer) {
            console.log('entro al create modal if it doesnt exist');
            dom._qrmContainer = createNode(DIV_TAG);
            addClass(dom._qrmContainer, 'qrm-wrapper');

            const qrmOverlay = createNode('div');
            addClass(qrmOverlay, 'qrm-overlay');
            appendChild(dom._qrmContainer, qrmOverlay);

            // QR modal
            dom._qrm = createNode(DIV_TAG);
            addClass(dom._qrm, 'qrm');
            addId(dom._qrm, 'qrcode');
            setAttribute(dom._qrm, 'role', 'dialog');
            setAttribute(dom._qrm, ARIA_HIDDEN, true);
            setAttribute(dom._qrm, 'aria-modal', true);
            setAttribute(dom._qrm, 'aria-labelledby', 'qrm__title');

            dom._qrmBody = createNode(DIV_TAG);
            dom._qrmTexts = createNode(DIV_TAG);
            dom._qrmBtns = createNode(DIV_TAG);

            addClassQrm(dom._qrmBody, 'body');
            addClassQrm(dom._qrmTexts, 'texts');
            addClassQrm(dom._qrmBtns, 'btns');

            //setAttribute(dom._qrm, 'aria-describedby', 'qrm__desc');

            if (consentModalLabelValue)
                setAttribute(dom._qrm, 'aria-label', consentModalLabelValue);
            else setAttribute(dom._qrm, 'aria-labelledby', 'qrm__title');

            const
                boxLayout = 'box',
                guiOptions = state._userConfig.guiOptions,
                consentModalOptions = guiOptions && guiOptions.consentModal,
                consentModalLayout = consentModalOptions && consentModalOptions.layout || boxLayout,
                isBoxLayout = consentModalLayout.split(' ')[0] === boxLayout;

            /**
             * Close icon-button (visible only in the 'box' layout)
             */
            if (closeIconLabelData && isBoxLayout) {
                if (!dom._qrmCloseIconBtn) {
                    dom._qrmCloseIconBtn = createNode(BUTTON_TAG);
                    dom._qrmCloseIconBtn.innerHTML = getSvgIcon();
                    addClassQrm(dom._qrmCloseIconBtn, 'btn');
                    addClassQrm(dom._qrmCloseIconBtn, 'btn--close');
                    addEvent(dom._qrmCloseIconBtn, CLICK_EVENT, () => {
                        _log('CookieConsent [ACCEPT]: necessary');
                        acceptAndHide();
                    });
                    appendChild(dom._qrmBody, dom._qrmCloseIconBtn);
                }

                setAttribute(dom._qrmCloseIconBtn, 'aria-label', closeIconLabelData);
            }

            appendChild(dom._qrmBody, dom._qrmTexts);

            appendChild(dom._qrmBody, dom._qrmBtns);

            dom._qrmDivTabindex = createNode(DIV_TAG);
            setAttribute(dom._qrmDivTabindex, 'tabIndex', -1);
            appendChild(dom._qrm, dom._qrmDivTabindex);

            appendChild(dom._qrm, dom._qrmBody);
            appendChild(dom._qrmContainer, dom._qrm);

            //var qrcode = new QRCode(document.getElementById('qrcode'));
            //qrcode.makeCode('ole.com.ar');

        }

        {
            if (!dom._qrmTitle) {
                dom._qrmTitle = createNode('h2');
                dom._qrmTitle.className = dom._qrmTitle.id = 'qrm__title';
                appendChild(dom._qrmTexts, dom._qrmTitle);
            }

            dom._qrmTitle.innerHTML = consentModalTitleValue;
        }

        let description = consentModalData.description;

        if (description) {
            if (state._revisionEnabled) {
                description = description.replace(
                    '{{revisionMessage}}',
                    state._validRevision
                        ? ''
                        : consentModalData.revisionMessage || ''
                );
            }

            if (!dom._qrmDescription) {
                dom._qrmDescription = createNode('p');
                dom._qrmDescription.className = dom._qrmDescription.id = 'qrm__desc';
                appendChild(dom._qrmTexts, dom._qrmDescription);
            }

            dom._qrmDescription.innerHTML = description;
        }

        /*if (acceptAllBtnData) {
            if (!dom._cmAcceptAllBtn) {
                dom._cmAcceptAllBtn = createNode(BUTTON_TAG);
                appendChild(dom._cmAcceptAllBtn, createFocusSpan());
                addClassCm(dom._cmAcceptAllBtn, 'btn');
                setAttribute(dom._cmAcceptAllBtn, DATA_ROLE, 'all');

                /*addEvent(dom._cmAcceptAllBtn, CLICK_EVENT, () => {
                    _log('CookieConsent [ACCEPT]: all');
                    acceptAndHide('all');
                });
            }

            dom._cmAcceptAllBtn.firstElementChild.innerHTML = acceptAllBtnData;
        }*/

        /*if (acceptNecessaryBtnData) {
            if (!dom._cmAcceptNecessaryBtn) {
                dom._cmAcceptNecessaryBtn = createNode(BUTTON_TAG);
                appendChild(dom._cmAcceptNecessaryBtn, createFocusSpan());
                addClassCm(dom._cmAcceptNecessaryBtn, 'btn');
                setAttribute(dom._cmAcceptNecessaryBtn, DATA_ROLE, 'necessary');

                /*addEvent(dom._cmAcceptNecessaryBtn, CLICK_EVENT, () => {
                    _log('CookieConsent [ACCEPT]: necessary');
                    acceptAndHide([]);
                });
            }

            dom._cmAcceptNecessaryBtn.firstElementChild.innerHTML = acceptNecessaryBtnData;
        }*/

        /*if (!dom._qrmBtnGroup) {
            dom._qrmBtnGroup = createNode(DIV_TAG);
            addClassQrm(dom._qrmBtnGroup, BTN_GROUP_CLASS);

            acceptAllBtnData && appendChild(dom._qrmBtnGroup, dom._qrmAcceptAllBtn);
            acceptNecessaryBtnData && appendChild(dom._qrmBtnGroup, dom._qrmAcceptNecessaryBtn);

            (acceptAllBtnData || acceptNecessaryBtnData) && appendChild(dom._qrmBody, dom._qrmBtnGroup);
            appendChild(dom._qrmBtns, dom._qrmBtnGroup);
        }

        if (dom._qrmShowPreferencesBtn && !dom._qrmBtnGroup2) {
            dom._qrmBtnGroup2 = createNode(DIV_TAG);

            if ((!dom._qrmAcceptNecessaryBtn || !dom._qrmAcceptAllBtn)) {
                appendChild(dom._qrmBtnGroup, dom._qrmShowPreferencesBtn);
                addClassQrm(dom._qrmBtnGroup, BTN_GROUP_CLASS + '--uneven');
            }else {
                addClassQrm(dom._qrmBtnGroup2, BTN_GROUP_CLASS);
                appendChild(dom._qrmBtnGroup2, dom._qrmShowPreferencesBtn);
                appendChild(dom._qrmBtns, dom._qrmBtnGroup2);
            }
        }*/

        /*if (footerData) {
            if (!dom._qrmFooterLinksGroup) {
                let _consentModalFooter = createNode(DIV_TAG);
                let _consentModalFooterLinks = createNode(DIV_TAG);
                dom._cmFooterLinksGroup = createNode(DIV_TAG);

                addClassQrm(_consentModalFooter, 'footer');
                addClassQrm(_consentModalFooterLinks, 'links');
                //addClassQrm(dom._qrmFooterLinksGroup, 'link-group');

                appendChild(_consentModalFooterLinks, dom._qrmFooterLinksGroup);
                appendChild(_consentModalFooter, _consentModalFooterLinks);
                appendChild(dom._qrm, _consentModalFooter);
            }

            dom._qrmFooterLinksGroup.innerHTML = footerData;
        }*/

        guiManager(2);

        if (!state._qrModalExists) {
            state._qrModalExists = true;

            _log('CookieConsent [HTML] created', QR_MODAL_NAME);

            fireEvent(globalObj._customEvents._onModalReady, QR_MODAL_NAME, dom._qrm);
            createMainContainer(api);
            appendChild(dom._ccMain, dom._qrmContainer);
            handleFocusTrap(dom._qrm);

            /**
             * Enable transition
             */
            setTimeout(() => addClass(dom._qrmContainer, 'cc--anim'), 100);
        }

        getModalFocusableData(3);

        addDataButtonListeners(dom._qrmBody, api, createPreferencesModal, createMainContainer);
    };

    /**
     * @callback CreateMainContainer
     */

    /**
     * @returns {HTMLSpanElement}
     */
    const createFocusSpan = () => {
        const span = createNode('span');

        if (!globalObj._dom._focusSpan)
            globalObj._dom._focusSpan = span;

        return span;
    };

    /**
     * Create consent modal and append it to "cc-main" el.
     * @param {import("../global").Api} api
     * @param {CreateMainContainer} createMainContainer
     */
    const createConsentModal = (api, createMainContainer) => {
        const state = globalObj._state;
        const dom = globalObj._dom;
        const {hide, showPreferences, acceptCategory, showQr} = api;

        /**
         * @type {import("../global").ConsentModalOptions}
         */
        const consentModalData = {
            acceptAllBtn: 'Use 360ofme',
            acceptNecessaryBtn: 'Just neccesary',
            description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip.',
            footer: '<a href="#link">Privacy Policy</a>\n<a href="#link">Terms and conditions</a>',
            showPreferencesBtn: 'Show Preferences',
            title: 'Hello kike, it\'s cookie time!'
        };

        //if (!consentModalData)
        //    return;

        console.log('la data del consent modal:', consentModalData);
        const acceptAllBtnData = consentModalData.acceptAllBtn,
            acceptNecessaryBtnData = consentModalData.acceptNecessaryBtn,
            showPreferencesBtnData = consentModalData.showPreferencesBtn,
            closeIconLabelData = consentModalData.closeIconLabel,
            footerData = consentModalData.footer,
            consentModalLabelValue = consentModalData.label,
            consentModalTitleValue = consentModalData.title;

        /**
         * @param {string|string[]} [categories]
         */
        const acceptAndHide = (categories) => {
            hide();
            acceptCategory(categories);
            console.log('Cristian is editing');

        };

        // Create modal if it doesn't exist
        if (!dom._cmContainer) {
            dom._cmContainer = createNode(DIV_TAG);
            dom._cm = createNode(DIV_TAG);
            dom._cmBody = createNode(DIV_TAG);
            dom._cmTexts = createNode(DIV_TAG);
            dom._cmBtns = createNode(DIV_TAG);

            addClass(dom._cmContainer, 'cm-wrapper');
            addClass(dom._cm, 'cm');
            addClassCm(dom._cmBody, 'body');
            addClassCm(dom._cmTexts, 'texts');
            addClassCm(dom._cmBtns, 'btns');

            setAttribute(dom._cm, 'role', 'dialog');
            setAttribute(dom._cm, 'aria-modal', 'true');
            setAttribute(dom._cm, ARIA_HIDDEN, 'false');
            setAttribute(dom._cm, 'aria-describedby', 'cm__desc');

            if (consentModalLabelValue)
                setAttribute(dom._cm, 'aria-label', consentModalLabelValue);
            else setAttribute(dom._cm, 'aria-labelledby', 'cm__title');

            const
                boxLayout = 'box',
                guiOptions = state._userConfig.guiOptions,
                consentModalOptions = guiOptions && guiOptions.consentModal,
                consentModalLayout = consentModalOptions && consentModalOptions.layout || boxLayout,
                isBoxLayout = consentModalLayout.split(' ')[0] === boxLayout;

            /**
             * Close icon-button (visible only in the 'box' layout)
             */
            if (closeIconLabelData && isBoxLayout) {
                if (!dom._cmCloseIconBtn) {
                    dom._cmCloseIconBtn = createNode(BUTTON_TAG);
                    dom._cmCloseIconBtn.innerHTML = getSvgIcon();
                    addClassCm(dom._cmCloseIconBtn, 'btn');
                    addClassCm(dom._cmCloseIconBtn, 'btn--close');
                    addEvent(dom._cmCloseIconBtn, CLICK_EVENT, () => {
                        _log('CookieConsent [ACCEPT]: necessary');
                        acceptAndHide([]);
                    });
                    appendChild(dom._cmBody, dom._cmCloseIconBtn);
                }

                setAttribute(dom._cmCloseIconBtn, 'aria-label', closeIconLabelData);
            }

            appendChild(dom._cmBody, dom._cmTexts);

            appendChild(dom._cmBody, dom._cmBtns);

            dom._cmDivTabindex = createNode(DIV_TAG);
            setAttribute(dom._cmDivTabindex, 'tabIndex', -1);
            appendChild(dom._cm, dom._cmDivTabindex);

            appendChild(dom._cm, dom._cmBody);
            appendChild(dom._cmContainer, dom._cm);
        }

        {
            if (!dom._cmTitle) {
                dom._cmTitle = createNode('h2');
                dom._cmTitle.className = dom._cmTitle.id = 'cm__title';
                appendChild(dom._cmTexts, dom._cmTitle);
            }

            dom._cmTitle.innerHTML = consentModalTitleValue;
        }

        let description = consentModalData.description;

        if (description) {
            if (state._revisionEnabled) {
                description = description.replace(
                    '{{revisionMessage}}',
                    state._validRevision
                        ? ''
                        : consentModalData.revisionMessage || ''
                );
            }

            if (!dom._cmDescription) {
                dom._cmDescription = createNode('p');
                dom._cmDescription.className = dom._cmDescription.id = 'cm__desc';
                appendChild(dom._cmTexts, dom._cmDescription);
            }

            dom._cmDescription.innerHTML = description;
        }

        {
            if (!dom._cmAcceptAllBtn) {
                dom._cmAcceptAllBtn = createNode(BUTTON_TAG);
                appendChild(dom._cmAcceptAllBtn, createFocusSpan());
                addClassCm(dom._cmAcceptAllBtn, 'btn');
                setAttribute(dom._cmAcceptAllBtn, DATA_ROLE, 'all');

                /*addEvent(dom._cmAcceptAllBtn, CLICK_EVENT, () => {
                    _log('CookieConsent [ACCEPT]: all');
                    acceptAndHide('all');
                });*/

                addEvent(dom._cmAcceptAllBtn, 'mouseenter', () => {
                    if (!state._qrModalExists) {
                        createQRModal(api, createMainContainer);
                        console.log('MOuese enter kike');
                    }
                });
                addEvent(dom._cmAcceptAllBtn, CLICK_EVENT, showQr);
            }

            dom._cmAcceptAllBtn.firstElementChild.innerHTML = acceptAllBtnData;
        }

        {
            if (!dom._cmAcceptNecessaryBtn) {
                dom._cmAcceptNecessaryBtn = createNode(BUTTON_TAG);
                appendChild(dom._cmAcceptNecessaryBtn, createFocusSpan());
                addClassCm(dom._cmAcceptNecessaryBtn, 'btn');
                setAttribute(dom._cmAcceptNecessaryBtn, DATA_ROLE, 'necessary');

                addEvent(dom._cmAcceptNecessaryBtn, CLICK_EVENT, () => {
                    _log('CookieConsent [ACCEPT]: necessary');
                    acceptAndHide([]);
                });
            }

            dom._cmAcceptNecessaryBtn.firstElementChild.innerHTML = acceptNecessaryBtnData;
        }

        {
            if (!dom._cmShowPreferencesBtn) {
                dom._cmShowPreferencesBtn = createNode(BUTTON_TAG);
                appendChild(dom._cmShowPreferencesBtn, createFocusSpan());
                addClassCm(dom._cmShowPreferencesBtn, 'btn');
                addClassCm(dom._cmShowPreferencesBtn, 'btn--secondary');
                setAttribute(dom._cmShowPreferencesBtn, DATA_ROLE, 'show');

                addEvent(dom._cmShowPreferencesBtn, 'mouseenter', () => {
                    if (!state._preferencesModalExists)
                        createPreferencesModal(api, createMainContainer);
                });
                addEvent(dom._cmShowPreferencesBtn, CLICK_EVENT, showPreferences);
            }

            dom._cmShowPreferencesBtn.firstElementChild.innerHTML = showPreferencesBtnData;
        }

        if (!dom._cmBtnGroup) {
            dom._cmBtnGroup = createNode(DIV_TAG);
            addClassCm(dom._cmBtnGroup, BTN_GROUP_CLASS);

            appendChild(dom._cmBtnGroup, dom._cmAcceptAllBtn);
            appendChild(dom._cmBtnGroup, dom._cmAcceptNecessaryBtn);

            appendChild(dom._cmBody, dom._cmBtnGroup);
            appendChild(dom._cmBtns, dom._cmBtnGroup);
        }

        if (dom._cmShowPreferencesBtn && !dom._cmBtnGroup2) {
            dom._cmBtnGroup2 = createNode(DIV_TAG);

            if ((!dom._cmAcceptNecessaryBtn || !dom._cmAcceptAllBtn)) {
                appendChild(dom._cmBtnGroup, dom._cmShowPreferencesBtn);
                addClassCm(dom._cmBtnGroup, BTN_GROUP_CLASS + '--uneven');
            }else {
                addClassCm(dom._cmBtnGroup2, BTN_GROUP_CLASS);
                appendChild(dom._cmBtnGroup2, dom._cmShowPreferencesBtn);
                appendChild(dom._cmBtns, dom._cmBtnGroup2);
            }
        }

        {
            if (!dom._cmFooterLinksGroup) {
                let _consentModalFooter = createNode(DIV_TAG);
                let _consentModalFooterLinks = createNode(DIV_TAG);
                dom._cmFooterLinksGroup = createNode(DIV_TAG);

                addClassCm(_consentModalFooter, 'footer');
                addClassCm(_consentModalFooterLinks, 'links');
                addClassCm(dom._cmFooterLinksGroup, 'link-group');

                appendChild(_consentModalFooterLinks, dom._cmFooterLinksGroup);
                appendChild(_consentModalFooter, _consentModalFooterLinks);
                appendChild(dom._cm, _consentModalFooter);
            }

            dom._cmFooterLinksGroup.innerHTML = footerData;
        }

        guiManager(0);

        if (!state._consentModalExists) {
            state._consentModalExists = true;

            _log('CookieConsent [HTML] created', CONSENT_MODAL_NAME);

            fireEvent(globalObj._customEvents._onModalReady, CONSENT_MODAL_NAME, dom._cm);
            createMainContainer(api);
            appendChild(dom._ccMain, dom._cmContainer);
            handleFocusTrap(dom._cm);

            /**
             * Enable transition
             */
            setTimeout(() => addClass(dom._cmContainer, 'cc--anim'), 100);
        }

        getModalFocusableData(1);

        addDataButtonListeners(dom._cmBody, api, createPreferencesModal, createMainContainer);
    };

    /**
     * Detect the available language. The language autodetection process prioritizes finding translations
     * for the complete language code. If translations for the complete code are unavailable, the detection
     * mechanism then resorts to searching for the language-only version.
     * Works with 'en', 'en_US' and 'en-US'.
     *
     * @param {string} languageCode - The language code to be detected.
     * @returns {?string} The detected language code, or null if not detected.
     */
    const getAvailableLanguage = (languageCode) => {
        if (!isString(languageCode))
            return null;

        if (languageCode in globalObj._state._allTranslations)
            return languageCode;

        /**
         * @type {string}
         */
        let language = languageCode.slice(0, 2);

        if (language in globalObj._state._allTranslations)
            return language;

        return null;
    };

    /**
     * Returns the current language code
     * @returns {string}
     */
    const getCurrentLanguageCode = () => {
        return globalObj._state._currentLanguageCode || globalObj._state._userConfig.language.default;
    };

    /**
     * Set language code
     * @param {string} newLanguageCode
     */
    const setCurrentLanguageCode = (newLanguageCode) => {
        newLanguageCode && (globalObj._state._currentLanguageCode = newLanguageCode);
    };

    /**
     * Get current client's browser language
     * returns only the first 2 chars: en-US => en
     * @returns {string} language
     */
    const getBrowserLanguageCode = () => navigator.language;

    /**
     * Get the lang attribute
     * @returns lang attribute
     */
    const getDocumentLanguageCode = () => document.documentElement.lang;

    /**
     * Resolve the language to use.
     * @returns {string} language code
     */
    const resolveCurrentLanguageCode = () =>  {
        const autoDetect = globalObj._state._userConfig.language.autoDetect;

        if (autoDetect) {
            _log('CookieConsent [LANG]: autoDetect strategy: "' + autoDetect + '"');

            const detectionStrategies = {
                browser: getBrowserLanguageCode(),
                document: getDocumentLanguageCode()
            };

            /**
             * @type {string}
             */
            const newLanguageCode = getAvailableLanguage(detectionStrategies[autoDetect]);

            if (newLanguageCode)
                return newLanguageCode;
        }

        /**
         * Use current language
         */
        return getCurrentLanguageCode();
    };

    /**
     * Load translation
     * @param {string | null} [desiredLanguageCode]
     */
    const loadTranslationData = async (desiredLanguageCode) => {
        const state = globalObj._state;

        /**
         * @type {string}
         */
        let currentLanguageCode = getAvailableLanguage(desiredLanguageCode)
            ? desiredLanguageCode
            : getCurrentLanguageCode();

        let currentTranslation = state._allTranslations[currentLanguageCode];

        if (!currentTranslation)
            return false;

        /**
         * If translation is a string, fetch the external json file and replace
         * the string (path to json file) with the parsed object
         */
        if (isString(currentTranslation)) {
            const fetchedTranslation = await fetchJson(currentTranslation);

            if (!fetchedTranslation)
                return false;

            currentTranslation = fetchedTranslation;
        }

        state._currentTranslation = currentTranslation;
        setCurrentLanguageCode(currentLanguageCode);

        _log('CookieConsent [LANG]: set language: "' + currentLanguageCode + '"');

        return true;
    };

    /**
     * Toggle RTL class on/off based on current language
     */
    const handleRtlLanguage = () => {
        let rtlLanguages = globalObj._state._userConfig.language.rtl;
        let ccMain = globalObj._dom._ccMain;

        if (rtlLanguages && ccMain) {
            if (!isArray(rtlLanguages))
                rtlLanguages = [rtlLanguages];

            elContains(rtlLanguages, globalObj._state._currentLanguageCode)
                ? addClass(ccMain, 'cc--rtl')
                : removeClass(ccMain, 'cc--rtl');
        }
    };

    const createMainContainer = () => {
        const dom = globalObj._dom;

        if (dom._ccMain) return;

        dom._ccMain = createNode(DIV_TAG);
        dom._ccMain.id = 'cc-main';
        dom._ccMain.setAttribute('data-nosnippet', '');

        handleRtlLanguage();

        let root = globalObj._state._userConfig.root;

        if (root && isString(root))
            root = document.querySelector(root);

        // Append main container to dom
        (root || dom._document.body).appendChild(dom._ccMain);
    };

    /**
     * @param {import('../global').Api} api
     */
    const generateHtml = (api) => {
        addDataButtonListeners(null, api, createPreferencesModal, createMainContainer);

        if (globalObj._state._invalidConsent)
            createConsentModal(api, createMainContainer);

        if (!globalObj._config.lazyHtmlGeneration)
            createPreferencesModal(api, createMainContainer);
    };

    const localStorageManager = {
        /**
         * @param {string} key
         * @param {string} value
         */
        _setItem: (key, value) => {
            safeRun(() => localStorage.setItem(key, value));
        },

        /**
         * @param {string} key
         */
        _getItem: (key) => safeRun(() => localStorage.getItem(key)) || '',

        /**
         * @param {string} key
         */
        _removeItem: (key) => safeRun(() => localStorage.removeItem(key))
    };

    /**
     * @param {boolean} [isFirstConsent]
     */
    const getCategoriesWithCookies = (isFirstConsent) => {
        const state = globalObj._state;

        const categoriesToFilter = isFirstConsent
            ? state._allCategoryNames
            : state._lastChangedCategoryNames;

        /**
         * Filter out categories with readOnly=true or don't have an autoClear object
         */
        return categoriesToFilter.filter(categoryName => {
            const currentCategoryObject = state._allDefinedCategories[categoryName];

            return !!currentCategoryObject
                && !currentCategoryObject.readOnly
                && !!currentCategoryObject.autoClear;
        });
    };

    /**
     * @param {string[]} allCookies
     * @param {string} cookieName
     */
    const findMatchingCookies = (allCookies, cookieName) => {
        if (cookieName instanceof RegExp) {
            return allCookies.filter(cookie => cookieName.test(cookie));
        } else {
            const cookieIndex = indexOf(allCookies, cookieName);
            return cookieIndex > -1
                ? [allCookies[cookieIndex]]
                : [];
        }
    };

    /**
     * Delete all unused cookies
     * @param {boolean} [isFirstConsent]
     */
    const autoclearCookiesHelper = (isFirstConsent) => {
        const state = globalObj._state;
        const allCookiesArray = getAllCookies();
        const categoriesToClear = getCategoriesWithCookies(isFirstConsent);

        /**
         * Clear cookies for each disabled service
         */
        for (const categoryName in state._lastChangedServices) {
            for (const serviceName of state._lastChangedServices[categoryName]) {
                const serviceCookies = state._allDefinedServices[categoryName][serviceName].cookies;
                const serviceIsDisabled = !elContains(state._acceptedServices[categoryName], serviceName);

                if (!serviceIsDisabled || !serviceCookies)
                    continue;

                for (const cookieItem of serviceCookies) {
                    const foundCookies = findMatchingCookies(allCookiesArray, cookieItem.name);
                    eraseCookiesHelper(foundCookies, cookieItem.path, cookieItem.domain);
                }
            }
        }

        for (const currentCategoryName of categoriesToClear) {
            const category = state._allDefinedCategories[currentCategoryName];
            const autoClear = category.autoClear;
            const autoClearCookies = autoClear && autoClear.cookies || [];

            const categoryWasJustChanged = elContains(state._lastChangedCategoryNames, currentCategoryName);
            const categoryIsDisabled = !elContains(state._acceptedCategories, currentCategoryName);
            const categoryWasJustDisabled = categoryWasJustChanged && categoryIsDisabled;

            const shouldClearCookies = isFirstConsent
                ? categoryIsDisabled
                : categoryWasJustDisabled;

            if (!shouldClearCookies)
                continue;

            if (autoClear.reloadPage && categoryWasJustDisabled)
                state._reloadPage = true;

            for (const cookieItem of autoClearCookies) {
                const foundCookies = findMatchingCookies(allCookiesArray, cookieItem.name);
                eraseCookiesHelper(foundCookies, cookieItem.path, cookieItem.domain);
            }
        }
    };

    const saveCookiePreferences = () => {
        const state = globalObj._state;

        /**
         * Determine if categories were changed from last state (saved in the cookie)
         */
        state._lastChangedCategoryNames = globalObj._config.mode === OPT_OUT_MODE && state._invalidConsent
            ? arrayDiff(state._defaultEnabledCategories, state._acceptedCategories)
            : arrayDiff(state._acceptedCategories, state._savedCookieContent.categories);

        let categoriesWereChanged = state._lastChangedCategoryNames.length > 0;
        let servicesWereChanged = false;

        /**
         * Determine if services were changed from last state
         */
        for (const categoryName of state._allCategoryNames) {
            state._lastChangedServices[categoryName] = arrayDiff(
                state._acceptedServices[categoryName],
                state._lastEnabledServices[categoryName]
            );

            if (state._lastChangedServices[categoryName].length > 0)
                servicesWereChanged = true;
        }

        //{{START: GUI}}
        const categoryToggles = globalObj._dom._categoryCheckboxInputs;

        /**
         * If the category is accepted check checkbox,
         * otherwise uncheck it
         */
        for (const categoryName in categoryToggles) {
            categoryToggles[categoryName].checked = elContains(state._acceptedCategories, categoryName);
        }

        for (const categoryName of state._allCategoryNames) {
            const servicesToggles = globalObj._dom._serviceCheckboxInputs[categoryName];
            const enabledServices = state._acceptedServices[categoryName];

            for (const serviceName in servicesToggles) {
                const serviceInput = servicesToggles[serviceName];
                serviceInput.checked = elContains(enabledServices, serviceName);
            }
        }
        //{{END: GUI}}

        if (!state._consentTimestamp)
            state._consentTimestamp = new Date();

        if (!state._consentId)
            state._consentId = uuidv4();

        state._savedCookieContent = {
            categories: deepCopy(state._acceptedCategories),
            revision: globalObj._config.revision,
            data: state._cookieData,
            consentTimestamp: state._consentTimestamp.toISOString(),
            consentId: state._consentId,
            services: deepCopy(state._acceptedServices)
        };

        let isFirstConsent = false;
        const stateChanged = categoriesWereChanged || servicesWereChanged;

        if (state._invalidConsent || stateChanged) {
            /**
             * Set consent as valid
             */
            if (state._invalidConsent) {
                state._invalidConsent = false;
                isFirstConsent = true;
            }

            state._lastConsentTimestamp = !state._lastConsentTimestamp
                ? state._consentTimestamp
                : new Date();

            state._savedCookieContent.lastConsentTimestamp = state._lastConsentTimestamp.toISOString();

            setCookie();

            const isAutoClearEnabled = globalObj._config.autoClearCookies;
            const shouldClearCookies = isFirstConsent || stateChanged;

            if (isAutoClearEnabled && shouldClearCookies)
                autoclearCookiesHelper(isFirstConsent);

            manageExistingScripts();
        }

        if (isFirstConsent) {
            fireEvent(globalObj._customEvents._onFirstConsent);
            fireEvent(globalObj._customEvents._onConsent);

            if (globalObj._config.mode === OPT_IN_MODE)
                return;
        }

        if (stateChanged)
            fireEvent(globalObj._customEvents._onChange);

        /**
         * Reload page if needed
         */
        if (state._reloadPage) {
            state._reloadPage = false;
            location.reload();
        }
    };

    /**
     * Set plugin's cookie
     * @param {boolean} [useRemainingExpirationTime]
     */
    const setCookie = (useRemainingExpirationTime) => {
        const { hostname, protocol } = location;
        const { name, path, domain, sameSite, useLocalStorage } = globalObj._config.cookie;

        const expiresAfterMs = useRemainingExpirationTime
            ? getRemainingExpirationTimeMS()
            : getExpiresAfterDaysValue()*86400000;

        /**
         * Expiration date
         */
        const date = new Date();
        date.setTime(date.getTime() + expiresAfterMs);

        /**
         * Store the expiration date in the cookie (in case localstorage is used)
         */

        globalObj._state._savedCookieContent.expirationTime = date.getTime();

        const value = JSON.stringify(globalObj._state._savedCookieContent);

        /**
         * Encode value (RFC compliant)
         */
        const cookieValue = encodeURIComponent(value);

        let cookieStr = name + '='
            + cookieValue
            + (expiresAfterMs !== 0 ? '; expires=' + date.toUTCString() : '')
            + '; Path=' + path
            + '; SameSite=' + sameSite;

        /**
         * Set "domain" only if hostname contains a dot (e.g domain.com)
         * to ensure that cookie works with 'localhost'
         */
        if (elContains(hostname, '.'))
            cookieStr += '; Domain=' + domain;

        if (protocol === 'https:')
            cookieStr += '; Secure';

        useLocalStorage
            ? localStorageManager._setItem(name, value)
            : document.cookie = cookieStr;

        _log('CookieConsent [SET_COOKIE]: ' + name + ':', globalObj._state._savedCookieContent);
    };

    /**
     * Parse cookie value using JSON.parse
     * @param {string} value
     */
    const parseCookie = (value, skipDecode) => {
        /**
         * @type {import('../../types').CookieValue}
         */
        let parsedValue;

        parsedValue = safeRun(() => JSON.parse(skipDecode
            ? value
            : decodeURIComponent(value)
        ), true) || {};

        return parsedValue;
    };

    /**
     * Delete cookie by name & path
     * @param {string[]} cookies Array of cookie names
     * @param {string} [customPath]
     * @param {string} [customDomain]
     */
    const eraseCookiesHelper = (cookies, customPath, customDomain) => {
        if (cookies.length === 0)
            return;

        const domain = customDomain || globalObj._config.cookie.domain;
        const path = customPath || globalObj._config.cookie.path;
        const isWwwSubdomain = domain.slice(0, 4) === 'www.';
        const mainDomain = isWwwSubdomain && domain.substring(4);

        /**
         * Helper function to erase cookie
         * @param {string} cookie
         * @param {string} [domain]
         */
        const erase = (cookie, domain) => {
            document.cookie = cookie + '='
                + '; path=' + path
                + (domain ? '; domain=.' + domain : '')
                + '; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        };

        for (const cookieName of cookies) {

            /**
             * 2 attempts to erase the cookie:
             * - without domain
             * - with domain
             */
            erase(cookieName);
            erase(cookieName, domain);

            /**
             * If domain starts with 'www.',
             * also erase the cookie for the
             * main domain (without www)
             */
            if (isWwwSubdomain)
                erase(cookieName, mainDomain);

            _log('CookieConsent [AUTOCLEAR]: deleting cookie: "' + cookieName + '" path: "' + path + '" domain:', domain);
        }
    };

    /**
     * Get plugin cookie
     * @param {string} [customName]
     */
    const getPluginCookie = (customName) => {
        const name = customName || globalObj._config.cookie.name;
        const useLocalStorage = globalObj._config.cookie.useLocalStorage;
        const valueStr = useLocalStorage
            ? localStorageManager._getItem(name)
            : getSingleCookie(name, true);
        return parseCookie(valueStr, useLocalStorage);
    };

    /**
     * Returns the cookie name/value, if it exists
     * @param {string} name
     * @param {boolean} getValue
     * @returns {string}
     */
    const getSingleCookie = (name, getValue) => {
        const found = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');

        return found
            ? (getValue ? found.pop() : name)
            : '';
    };

    /**
     * Returns array with all the cookie names
     * @param {RegExp} regex
     * @returns {string[]}
     */
    const getAllCookies = (regex) => {
        const allCookies = document.cookie.split(/;\s*/);

        /**
         * @type {string[]}
         */
        const cookieNames = [];

        /**
         * Save only the cookie names
         */
        for (const cookie of allCookies) {
            let name = cookie.split('=')[0];

            if (regex) {
                safeRun(() => {
                    regex.test(name) && cookieNames.push(name);
                });
            } else {
                cookieNames.push(name);
            }
        }

        return cookieNames;
    };

    /**
     * Configure CookieConsent
     * @param {import("./global").UserConfig} userConfig
     */
    const setConfig = (userConfig) => {
        const { _dom, _config, _state } = globalObj;

        const
            config = _config,
            state = _state,
            { cookie } = config,
            callbacks = globalObj._callbacks,
            userCookieConfig = userConfig.cookie,
            userCategories = userConfig.categories,
            allCategoryNames = getKeys(userCategories) || [],
            nav = navigator,
            doc = document;

        /**
         * Access the 'window' and 'document' objects
         * during execution, rather than on import
         * (avoid window/document is not defined error)
         */
        _dom._document = doc;
        //{{START: GUI}}
        _dom._htmlDom = doc.documentElement;
        //{{END: GUI}}
        cookie.domain = location.hostname;

        /**
         * Make user configuration globally available
         */
        state._userConfig = userConfig;
        state._allDefinedCategories = userCategories;
        state._allCategoryNames = allCategoryNames;

        //{{START: GUI}}
        state._allTranslations = userConfig.language.translations;
        state._disablePageInteraction = !!userConfig.disablePageInteraction;
        //{{END: GUI}}

        /**
         * Save references to callback functions
         */
        callbacks._onFirstConsent = userConfig.onFirstConsent;
        callbacks._onConsent = userConfig.onConsent;
        callbacks._onChange = userConfig.onChange;

        //{{START: GUI}}
        callbacks._onModalHide = userConfig.onModalHide;
        callbacks._onModalShow = userConfig.onModalShow;
        callbacks._onModalReady = userConfig.onModalReady;
        //{{END: GUI}}

        const {
            mode,
            //{{START: GUI}}
            autoShow,
            lazyHtmlGeneration,
            //{{END: GUI}}
            autoClearCookies,
            revision,
            manageScriptTags,
            hideFromBots,
        } = userConfig;

        if (mode === OPT_OUT_MODE)
            config.mode = mode;

        if (typeof autoClearCookies === 'boolean')
            config.autoClearCookies = autoClearCookies;

        if (typeof manageScriptTags === 'boolean')
            config.manageScriptTags = manageScriptTags;

        if (typeof revision === 'number' && revision >= 0) {
            config.revision = revision;
            state._revisionEnabled = true;
        }

        //{{START: GUI}}

        if (typeof autoShow === 'boolean')
            config.autoShow = autoShow;

        if (typeof lazyHtmlGeneration === 'boolean')
            config.lazyHtmlGeneration = lazyHtmlGeneration;

        //{{END: GUI}}

        if (hideFromBots === false)
            config.hideFromBots = false;

        if (config.hideFromBots === true && nav)
            state._botAgentDetected = (nav.userAgent && /bot|crawl|spider|slurp|teoma/i.test(nav.userAgent)) || nav.webdriver;

        if (isObject(userCookieConfig))
            config.cookie = {...cookie, ...userCookieConfig};

        _log('CookieConsent [CONFIG]: configuration:', userConfig);
        _log('CookieConsent [CONFIG]: autoClearCookies:', config.autoClearCookies);
        _log('CookieConsent [CONFIG]: revision enabled:', state._revisionEnabled);
        _log('CookieConsent [CONFIG]: manageScriptTags:', config.manageScriptTags);

        fetchCategoriesAndServices(allCategoryNames);
        retrieveScriptElements();

        //{{START: GUI}}
        setCurrentLanguageCode(resolveCurrentLanguageCode());
        //{{END: GUI}}
    };

    window.QRCode = QRCode;

    /**
     * Accept API
     * @param {string[]|string} categories - Categories to accept
     * @param {string[]} [excludedCategories]
     */
    const acceptCategory = (categories, excludedCategories = []) => {
        resolveEnabledCategories(categories, excludedCategories);
        resolveEnabledServices();
        saveCookiePreferences();
    };

    /**
     * Returns true if cookie category is accepted
     * @param {string} category
     */
    const acceptedCategory = (category) => {

        const acceptedCategories = !globalObj._state._invalidConsent
            ? globalObj._state._acceptedCategories
            : [];

        return elContains(acceptedCategories, category);
    };

    /**
     * Accept one or multiple services under a specific category
     * @param {string|string[]} service
     * @param {string} category
     */
    const acceptService = (service, category) => {
        const { _allCategoryNames, _allDefinedServices,  } = globalObj._state;

        if (
            !service
            || !category
            || !isString(category)
            || !elContains(_allCategoryNames, category)
            || getKeys(_allDefinedServices[category]).length === 0
        ) {
            return false;
        }

        //{{START: GUI}}
        updateModalToggles(service, category);
        //{{END: GUI}}

        acceptCategory();
    };

    /**
     * Returns true if the service in the specified
     * category is accepted/enabled
     * @param {string} service
     * @param {string} category
     */
    const acceptedService = (service, category) => {
        const acceptedServices = !globalObj._state._invalidConsent
            ? globalObj._state._acceptedServices[category]
            : [];

        return elContains(acceptedServices, service);
    };

    /**
     * Returns true if cookie was found and has valid value (not an empty string)
     * @param {string} cookieName
     */
    const validCookie = (cookieName) => getSingleCookie(cookieName, true) !== '';

    /**
     * Erase cookies API
     * @param {(string|RegExp|(string|RegExp)[])} cookies
     * @param {string} [path]
     * @param {string} [domain]
     */
    const eraseCookies = (cookies, path, domain) => {
        let allCookies = [];

        /**
         * Add cookie to allCookies array if it exists
         * @param {string | RegExp} cookieName
         */
        const addCookieIfExists = (cookieName) => {
            if (isString(cookieName)) {
                let name = getSingleCookie(cookieName);
                name !== '' && allCookies.push(name);
            } else {
                allCookies.push(...getAllCookies(cookieName));
            }
        };

        if (isArray(cookies)) {
            for (let cookie of cookies) {
                addCookieIfExists(cookie);
            }
        } else {
            addCookieIfExists(cookies);
        }

        eraseCookiesHelper(allCookies, path, domain);
    };

    //{{START: GUI}}

    /**
     * Show cookie consent modal
     * @param {boolean} [createModal] create modal if it doesn't exist
     */
    const show = (createModal) => {
        const { _dom, _state } = globalObj;

        if (_state._consentModalVisible)
            return;

        if (!_state._consentModalExists) {
            if (createModal) {
                createConsentModal(miniAPI, createMainContainer);
            } else {
                return;
            }
        }

        _state._consentModalVisible = true;
        _state._lastFocusedElemBeforeModal = getActiveElement();

        if (_state._disablePageInteraction)
            toggleDisableInteraction(true);

        focusAfterTransition(_dom._cm, 1);

        addClass(_dom._htmlDom, TOGGLE_CONSENT_MODAL_CLASS);
        setAttribute(_dom._cm, ARIA_HIDDEN, 'false');

        /**
         * Set focus to consentModal
         */
        setTimeout(() => {
            focus(globalObj._dom._cmDivTabindex);
        }, 100);

        _log('CookieConsent [TOGGLE]: show consentModal');

        fireEvent(globalObj._customEvents._onModalShow, CONSENT_MODAL_NAME);
    };

    /**
     * Hide consent modal
     */
    const hide = () => {
        const { _dom, _state, _customEvents } = globalObj;

        if (!_state._consentModalVisible)
            return;

        _state._consentModalVisible = false;

        if (_state._disablePageInteraction)
            toggleDisableInteraction();

        /**
         * Fix focus restoration to body with Chrome
         */
        focus(_dom._focusSpan, true);

        removeClass(_dom._htmlDom, TOGGLE_CONSENT_MODAL_CLASS);
        setAttribute(_dom._cm, ARIA_HIDDEN, 'true');

        /**
         * Restore focus to last focused element
         */
        focus(_state._lastFocusedElemBeforeModal);
        _state._lastFocusedElemBeforeModal = null;

        _log('CookieConsent [TOGGLE]: hide consentModal');

        fireEvent(_customEvents._onModalHide, CONSENT_MODAL_NAME);
    };

    /**
     * Show preferences modal
     */
    const showPreferences = () => {
        const state = globalObj._state;

        if (state._preferencesModalVisible)
            return;

        if (!state._preferencesModalExists)
            createPreferencesModal(miniAPI, createMainContainer);

        state._preferencesModalVisible = true;

        // If there is no consent-modal, keep track of the last focused elem.
        if (!state._consentModalVisible) {
            state._lastFocusedElemBeforeModal = getActiveElement();
        } else {
            state._lastFocusedModalElement = getActiveElement();
        }

        focusAfterTransition(globalObj._dom._pm, 2);

        addClass(globalObj._dom._htmlDom, TOGGLE_PREFERENCES_MODAL_CLASS);
        setAttribute(globalObj._dom._pm, ARIA_HIDDEN, 'false');

        /**
         * Set focus to preferencesModal
         */
        setTimeout(() => {
            focus(globalObj._dom._pmDivTabindex);
        }, 100);

        _log('CookieConsent [TOGGLE]: show preferencesModal');

        fireEvent(globalObj._customEvents._onModalShow, PREFERENCES_MODAL_NAME);
    };

    /**
     * Show QR Modal
     */
    const showQr = () => {
        console.log('shooooow kike showww');
        const state = globalObj._state;

        if (state._qrModalVisible)
            return;
        console.log('state qr visible:', state);
        if (!state._qrModalExists)
            createQRModal(miniAPI, createMainContainer);

        state._qrModalVisible = true;

        // If there is no consent-modal, keep track of the last focused elem.
        if (!state._consentModalVisible) {
            state._lastFocusedElemBeforeModal = getActiveElement();
        } else {
            state._lastFocusedModalElement = getActiveElement();
        }

        focusAfterTransition(globalObj._dom._qrm, 3);

        addClass(globalObj._dom._htmlDom, TOGGLE_QR_MODAL_CLASS);
        setAttribute(globalObj._dom._qrm, ARIA_HIDDEN, 'false');

        /**
         * show REAL QR
         */
        var qrcode = new QRCode(document.getElementById('qrcode'));
        qrcode.makeCode('ole.com.ar');

        /**
         * Set focus to preferencesModal
         */
        setTimeout(() => {
            focus(globalObj._dom._qrmDivTabindex);
        }, 100);

        _log('CookieConsent [TOGGLE]: show qrModal');

        fireEvent(globalObj._customEvents._onModalShow, QR_MODAL_NAME);
    };

    /**
     * https://github.com/orestbida/cookieconsent/issues/481
     */
    const discardUnsavedPreferences = () => {
        const consentIsValid = validConsent();
        const allDefinedCategories = globalObj._state._allDefinedCategories;
        const categoryInputs = globalObj._dom._categoryCheckboxInputs;
        const serviceInputs = globalObj._dom._serviceCheckboxInputs;

        /**
         * @param {string} category
         */
        const categoryEnabledByDefault = (category) => elContains(globalObj._state._defaultEnabledCategories, category);

        for (const category in categoryInputs) {
            const isReadOnly = !!allDefinedCategories[category].readOnly;

            categoryInputs[category].checked = isReadOnly || (consentIsValid
                ? acceptedCategory(category)
                : categoryEnabledByDefault(category)
            );

            for (const service in serviceInputs[category]) {
                serviceInputs[category][service].checked = isReadOnly || (consentIsValid
                    ? acceptedService(service, category)
                    : categoryEnabledByDefault(category)
                );
            }
        }
    };

    /**
     * Hide preferences modal
     */
    const hidePreferences = () => {
        const state = globalObj._state;

        if (!state._preferencesModalVisible)
            return;

        state._preferencesModalVisible = false;

        discardUnsavedPreferences();

        /**
         * Fix focus restoration to body with Chrome
         */
        focus(globalObj._dom._pmFocusSpan, true);

        removeClass(globalObj._dom._htmlDom, TOGGLE_PREFERENCES_MODAL_CLASS);
        setAttribute(globalObj._dom._pm, ARIA_HIDDEN, 'true');

        /**
         * If consent modal is visible, focus him (instead of page document)
         */
        if (state._consentModalVisible) {
            focus(state._lastFocusedModalElement);
            state._lastFocusedModalElement = null;
        } else {
            /**
             * Restore focus to last page element which had focus before modal opening
             */
            focus(state._lastFocusedElemBeforeModal);
            state._lastFocusedElemBeforeModal = null;
        }

        _log('CookieConsent [TOGGLE]: hide preferencesModal');

        fireEvent(globalObj._customEvents._onModalHide, PREFERENCES_MODAL_NAME);
    };

    var miniAPI = {
        show,
        hide,
        showPreferences,
        hidePreferences,
        acceptCategory,
        showQr
    };

    /**
     * Update/change modal's language
     * @param {string} lang new language
     * @param {boolean} [forceUpdate] update language fields forcefully
     * @returns {Promise<boolean>}
     */
    const setLanguage = async (newLanguageCode, forceUpdate) => {
        if (!getAvailableLanguage(newLanguageCode))
            return false;

        const state = globalObj._state;

        /**
         * Set language only if it differs from current
         */
        if (newLanguageCode !== getCurrentLanguageCode() || forceUpdate === true) {

            const loaded = await loadTranslationData(newLanguageCode);

            if (!loaded)
                return false;

            setCurrentLanguageCode(newLanguageCode);

            if (state._consentModalExists)
                createConsentModal(miniAPI, createMainContainer);

            if (state._preferencesModalExists)
                createPreferencesModal(miniAPI, createMainContainer);

            handleRtlLanguage();

            return true;
        }

        return false;
    };

    //{{END: GUI}}

    /**
     * Retrieve current user preferences (summary)
     * @returns {import("./global").UserPreferences}
     */
    const getUserPreferences = () => {
        const { _acceptType, _acceptedServices } = globalObj._state;
        const { accepted, rejected } = getCurrentCategoriesState();

        return deepCopy({
            acceptType: _acceptType,
            acceptedCategories: accepted,
            rejectedCategories: rejected,
            acceptedServices: _acceptedServices,
            rejectedServices: retrieveRejectedServices()
        });
    };

    /**
     * Dynamically load script (append to head)
     * @param {string} src
     * @param {{[key: string]: string}} [attrs] Custom attributes
     * @returns {Promise<boolean>} promise
     */
    const loadScript = (src, attrs) => {
        /**
         * @type {HTMLScriptElement}
         */
        let script = document.querySelector('script[src="' + src + '"]');

        return new Promise((resolve) => {
            if (script)
                return resolve(true);

            script = createNode('script');

            /**
             * Add custom attributes
             */
            if (isObject(attrs)) {
                for (const key in attrs) {
                    setAttribute(script, key, attrs[key]);
                }
            }

            script.onload = () => resolve(true);
            script.onerror = () => {
                /**
                 * Remove script from dom if error is thrown
                 */
                script.remove();
                resolve(false);
            };

            script.src = src;

            appendChild(document.head, script);
        });
    };

    /**
     * Save custom data inside cookie
     * @param {{
     *  value: any,
     *  mode: string
     * }} props
     * @returns {boolean}
     */
    const setCookieData = (props) => {
        let newData = props.value,
            mode = props.mode,
            set = false,
            cookieData;

        const state = globalObj._state;

        /**
         * If mode is 'update':
         * add/update only the specified props.
         */
        if (mode === 'update') {
            state._cookieData = cookieData = getCookie('data');
            const sameType = typeof cookieData === typeof newData;

            if (sameType && typeof cookieData === 'object') {
                !cookieData && (cookieData = {});

                for (let prop in newData) {
                    if (cookieData[prop] !== newData[prop]) {
                        cookieData[prop] = newData[prop];
                        set = true;
                    }
                }
            }else if ((sameType || !cookieData) && cookieData !== newData) {
                cookieData = newData;
                set = true;
            }
        } else {
            cookieData = newData;
            set = true;
        }

        if (set) {
            state._cookieData = cookieData;
            state._savedCookieContent.data = cookieData;
            setCookie(true);
        }

        return set;
    };

    /**
     * Retrieve data from existing cookie
     * @param {string} field
     * @param {string} [cookieName]
     * @returns {any}
     */
    const getCookie = (field, cookieName) => {
        const cookie = getPluginCookie(cookieName);

        return field
            ? cookie[field]
            : cookie;
    };

    /**
     * Return configuration object or just one of its fields.
     * @param {string} field
     * @returns {any}
     */
    const getConfig = (field) => {
        const config = globalObj._config;
        const userConfig = globalObj._state._userConfig;

        return field
            ? config[field] || userConfig[field]
            : {...config, ...userConfig, cookie:{...config.cookie}};
    };

    /**
     * Returns true if consent is valid
     * @returns {boolean}
     */
    const validConsent = () => !globalObj._state._invalidConsent;

    const retrieveState = () => {
        const state = globalObj._state;
        const config = globalObj._config;

        const cookieValue = getPluginCookie();

        const {
            categories,
            services,
            consentId,
            consentTimestamp,
            lastConsentTimestamp,
            data,
            revision
        } = cookieValue;

        const validCategories = isArray(categories);

        state._savedCookieContent = cookieValue;
        state._consentId = consentId;

        // If "_consentId" is present => assume that consent was previously given
        const validConsentId = !!consentId && isString(consentId);

        // Retrieve "_consentTimestamp"
        state._consentTimestamp = consentTimestamp;
        state._consentTimestamp && (state._consentTimestamp = new Date(consentTimestamp));

        // Retrieve "_lastConsentTimestamp"
        state._lastConsentTimestamp = lastConsentTimestamp;
        state._lastConsentTimestamp && (state._lastConsentTimestamp = new Date(lastConsentTimestamp));

        // Retrieve "data"
        state._cookieData = typeof data !== 'undefined'
            ? data
            : null;

        // If revision is enabled and current value !== saved value inside the cookie => revision is not valid
        if (state._revisionEnabled && validConsentId && revision !== config.revision)
            state._validRevision = false;

        state._invalidConsent = !validConsentId
            || !state._validRevision
            || !state._consentTimestamp
            || !state._lastConsentTimestamp
            || !validCategories;

        /**
         * If localStorage is enabled, also check the stored `expirationTime`
         */
        if (config.cookie.useLocalStorage && !state._invalidConsent) {
            state._invalidConsent = new Date().getTime() > (cookieValue.expirationTime || 0);
            state._invalidConsent && (localStorageManager._removeItem(config.cookie.name));
        }

        _log('CookieConsent [STATUS] valid consent:', !state._invalidConsent);
        retrieveEnabledCategoriesAndServices();

        /**
         * Retrieve last accepted categories from cookie
         * and calculate acceptType
         */
        if (!state._invalidConsent) {
            state._acceptedServices = {
                ...state._acceptedServices,
                ...services
            };

            setAcceptedCategories([
                ...state._readOnlyCategories,
                ...categories
            ]);
        } else {
            if (config.mode === OPT_OUT_MODE) {
                state._acceptedCategories = [
                    ...state._defaultEnabledCategories
                ];
            }
        }

        state._enabledServices = {...state._acceptedServices};
    };

    /**
     * Will run once and only if modals do not exist.
     * @param {import("./global").UserConfig} userConfig
     */
    const run = async (userConfig) => {
        const {
            _state,
            _config,
            _customEvents
        } = globalObj;

        const win = window;

        if (!win._ccRun) {
            win._ccRun = true;

            setConfig(userConfig);

            if (_state._botAgentDetected)
                return;

            retrieveState();

            const consentIsValid = validConsent();

            //{{START: GUI}}
            const translationLoaded = await loadTranslationData();

            if (!translationLoaded)
                return false;

            generateHtml(miniAPI);

            if (_config.autoShow && !consentIsValid)
                show(true);
            //{{END: GUI}}

            if (consentIsValid) {
                manageExistingScripts();
                return fireEvent(_customEvents._onConsent);
            }

            if (_config.mode === OPT_OUT_MODE)
                manageExistingScripts(_state._defaultEnabledCategories);
        }
    };

    /**
     * Reset cookieconsent.
     * @param {boolean} [deleteCookie] Delete plugin's cookie
     */
    const reset = (deleteCookie) => {
        //{{START: GUI}}
        const { _ccMain, _htmlDom } = globalObj._dom;
        //{{END: GUI}}

        const { name, path, domain, useLocalStorage } = globalObj._config.cookie;

        if (deleteCookie) {
            useLocalStorage
                ? localStorageManager._removeItem(name)
                : eraseCookies(name, path, domain);
        }

        /**
         * Remove data-cc event listeners
         */
        for (const {_element, _event, _listener} of globalObj._state._dataEventListeners) {
            _element.removeEventListener(_event, _listener);
        }

        //{{START: GUI}}
        /**
         * Remove main container from DOM
         */
        _ccMain && _ccMain.remove();

        /**
         * Remove any remaining classes
         */
        _htmlDom && _htmlDom.classList.remove(
            TOGGLE_DISABLE_INTERACTION_CLASS,
            TOGGLE_PREFERENCES_MODAL_CLASS,
            TOGGLE_CONSENT_MODAL_CLASS
        );
        //{{END: GUI}}

        const newGlobal = new GlobalState();

        /**
         * Reset all global state props.
         */
        for (const key in globalObj) {
            globalObj[key] = newGlobal[key];
        }

        window._ccRun = false;
    };

    exports.acceptCategory = acceptCategory;
    exports.acceptService = acceptService;
    exports.acceptedCategory = acceptedCategory;
    exports.acceptedService = acceptedService;
    exports.eraseCookies = eraseCookies;
    exports.getConfig = getConfig;
    exports.getCookie = getCookie;
    exports.getUserPreferences = getUserPreferences;
    exports.hide = hide;
    exports.hidePreferences = hidePreferences;
    exports.loadScript = loadScript;
    exports.reset = reset;
    exports.run = run;
    exports.setCookieData = setCookieData;
    exports.setLanguage = setLanguage;
    exports.show = show;
    exports.showPreferences = showPreferences;
    exports.showQr = showQr;
    exports.validConsent = validConsent;
    exports.validCookie = validCookie;

}));
