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
                _qrModalQRCreated: false,

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
    	 * @param {Number} [vOption.width=163]
    	 * @param {Number} [vOption.height=163]
    	 * @param {String} [vOption.colorDark="#000000"]
    	 * @param {String} [vOption.colorLight="#ffffff"]
    	 * @param {QRCode.CorrectLevel} [vOption.correctLevel=QRCode.CorrectLevel.H] [L|M|Q|H] 
    	 */
    	QRCode = function (el, vOption) {
    		this._htOption = {
    			width : 163, 
    			height : 163,
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
        const {hide, hideQR} = api;
        /**
         * @type {import("../global").PreferencesModalOptions}
         */
        const modalData = state._currentTranslation && state._currentTranslation.preferencesModal;

        // Create modal if it doesn't exist
        if (!dom._qrmContainer) {
            dom._qrmContainer = createNode(DIV_TAG);
            addClass(dom._qrmContainer, 'qrm-wrapper');

            const qrmOverlay = createNode('div');
            addClass(qrmOverlay, 'qrm-overlay');
            appendChild(dom._qrmContainer, qrmOverlay);

            /**
             * Hide modal when overlay is clicked
             */
            addEvent(qrmOverlay, CLICK_EVENT, hideQR);

            addEvent(dom._htmlDom, 'keydown', (event) => {
                if (event.keyCode === 27)
                    hideQR();
            }, true);

            // QR modal
            dom._qrm = createNode(DIV_TAG);
            addClass(dom._qrm, 'qrm');
            setAttribute(dom._qrm, 'role', 'dialog');
            setAttribute(dom._qrm, ARIA_HIDDEN, true);
            setAttribute(dom._qrm, 'aria-modal', true);

            dom._qrmTwo = createNode(DIV_TAG);
            addClass(dom._qrmTwo, 'qrm');
            addClass(dom._qrmTwo, 'qrm--box2');
            setAttribute(dom._qrmTwo, 'role', 'dialog');
            setAttribute(dom._qrmTwo, ARIA_HIDDEN, true);
            setAttribute(dom._qrmTwo, 'aria-modal', true);
            
            //  modal1
            dom._qrmHeader = createNode(DIV_TAG);
            addClassQrm(dom._qrmHeader, 'header');

            dom._qrmImage = createNode('img');
            addClassQrm(dom._qrmImage, 'img-title');

            dom._qrmCloseBtn = createNode(BUTTON_TAG);
            addClassQrm(dom._qrmCloseBtn, 'close-btn');
            setAttribute(dom._qrmCloseBtn, 'aria-label', modalData.closeIconLabel || '');
            addEvent(dom._qrmCloseBtn, CLICK_EVENT, hideQR);

            dom._qrmFocusSpan = createNode('span');
            dom._qrmFocusSpan.innerHTML = getSvgIcon();
            appendChild(dom._qrmCloseBtn, dom._qrmFocusSpan);

            appendChild(dom._qrmHeader, dom._qrmImage);
            appendChild(dom._qrmHeader, dom._qrmCloseBtn);

            //dom._qrmTitle.innerHTML = titleData;
            const imageDataLogo = 'data:image/png;base64,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';
            dom._qrmImage.src = imageDataLogo; // Set the source path of the image
            modalData.closeIconLabel && setAttribute(dom._qrmCloseBtn, 'aria-label', modalData.closeIconLabel);

            const boxLayout = 'box',
                guiOptions = state._userConfig.guiOptions,
                consentModalOptions = guiOptions && guiOptions.consentModal,
                consentModalLayout = consentModalOptions && consentModalOptions.layout || boxLayout;
                consentModalLayout.split(' ')[0] === boxLayout;

            // main body + 2 main divs to split the body
            dom._qrmBody = createNode(DIV_TAG);
            dom._leftSide = createNode(DIV_TAG);
            dom._rightSide = createNode(DIV_TAG);

            addClassQrm(dom._qrmBody, 'body');
            addClassQrm(dom._leftSide, 'left-side');
            addClassQrm(dom._rightSide, 'right-side');


            dom._qrmLeftInfoLeftSide = createNode(DIV_TAG);
            addClassQrm(dom._qrmLeftInfoLeftSide, 'left-info-left-side');
            dom._qrmLeftInfoRightSide = createNode(DIV_TAG);
            addClassQrm(dom._qrmLeftInfoRightSide, 'left-info-right-side');

            dom._qrmLeftBannerTitle = createNode('h2');
            addClassQrm(dom._qrmLeftBannerTitle, 'banner-title');
            dom._qrmLeftBannerTitle.innerHTML = 'This website uses cookies';


            appendChild(dom._qrmLeftInfoRightSide, dom._qrmLeftBannerTitle);

            //////////  

            // title + steps on the left side
            dom._qrmLeftMainTitle = createNode('h2');
            addClassQrm(dom._qrmLeftMainTitle, 'left-main-title');
            dom._qrmLeftMainTitle.innerHTML = ' Manage Your Cookies With 360ofme';

            appendChild(dom._leftSide, dom._qrmLeftMainTitle);

            dom.qrmLeftStepOne =  createNode(DIV_TAG);
            dom.qrmLeftStepTwo =  createNode(DIV_TAG);
            dom.qrmLeftStepThree =  createNode(DIV_TAG);
            addClassQrm(dom.qrmLeftStepOne, 'left-step');
            addClassQrm(dom.qrmLeftStepTwo, 'left-step');
            addClassQrm(dom.qrmLeftStepThree, 'left-step');

            //step 1
            dom._qrmLeftStepOneIconDiv = createNode(DIV_TAG);
            dom._qrmStepOneIcon = createNode('img');
            const firstStepIcon =  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAEzSURBVHgBpZLBUcJAFIb/twwBb5SwdqAVKB1ABcLRYRjYCsQCmNUDXoUO6MB0oB2QErgIaMI+34bECUPMOPqf3r4/3/5vdwOUqD6zF01rNSpEedGytrVp8gh7GhOh5XsMzJ3DIhma8AT0wDbgCTPd5ECJInYwn0OzzBvqPXAd4UcVkJcmhediQ5GDxu90tLHCH1UJMmMtE9074FJGPT8CxYx+gpjQbiZ4kNWVS1yv+EQq3qtlaRzhMR6Yt22AVwUag0hzgFXjaTo+jGrMWh4sPEkElvXZtCelljpUMU0Ohro7gH7zGvpirotgTaXn06nP8GlWygjZ7abg7tZEArYzI1WSQCuo0PfOYnQ/BqbL4Lmsw2/Qy59Hbq7NzIsssbOTX01SF5sAL42ZXRHTtXzTx3/0BVWFcwcyr4FdAAAAAElFTkSuQmCC';
            dom._qrmStepOneIcon.src = firstStepIcon;
            appendChild(dom._qrmLeftStepOneIconDiv, dom._qrmStepOneIcon);

            addClassQrm(dom._qrmLeftStepOneIconDiv, 'icon-div');

            dom._qrmLeftStepOneText = createNode('p');
            addClassQrm(dom._qrmLeftStepOneText, 'step-text');
            dom._qrmLeftStepOneText.innerHTML = 'Verify your identity to secure your data';
            appendChild(dom.qrmLeftStepOne, dom._qrmLeftStepOneIconDiv);
            appendChild(dom.qrmLeftStepOne, dom._qrmLeftStepOneText);

            //step 2
            dom._qrmLeftStepTwoIconDiv = createNode(DIV_TAG);
            dom._qrmStepTwoIcon = createNode('img');
            const secondStepIcon =  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAEXSURBVHgBlVHLTcNAEH1v4iTmZiogHUAJoQOoIHBEUQQuIQXARiIWR5IOkgqgg6QDXMJekCyS7LJjs8hXP2l2981v5wMEDJZml76ZEf7QL14eh8vnp8hhTDYozE6fiR4kMrRA5899i6cpMu8aH+kX5ioYswPlUhVZyAaRC5XUNL+eDhjX2V/NmMPC/Cc7OVwL/R3JifJgWInD2gs+oo+gIzoHdIb28BWJA25BTMTjptH4LR03oYf36JPohIhmZDq6HjwhHEWHnsAegcithLT3IcgGmR9n+ScTLoKhDLKncPE9zfd0mNflALn8zPINNVKwUmX1kJfeuXWQrb6bOmpbWU3zVb1p72HPKtgqNkZYMGkvW3di9f4FSNli2cAAvJcAAAAASUVORK5CYII=';
            dom._qrmStepTwoIcon.src = secondStepIcon;
            appendChild(dom._qrmLeftStepTwoIconDiv, dom._qrmStepTwoIcon);

            addClassQrm(dom._qrmLeftStepTwoIconDiv, 'icon-div');
            dom._qrmLeftStepTwoText = createNode('p');
            addClassQrm(dom._qrmLeftStepTwoText, 'step-text');
            dom._qrmLeftStepTwoText.innerHTML = 'Granular consent level options; decide what personal data you want to share under what conditions';
            appendChild(dom.qrmLeftStepTwo, dom._qrmLeftStepTwoIconDiv);
            appendChild(dom.qrmLeftStepTwo, dom._qrmLeftStepTwoText);

            //step  3
            dom._qrmLeftStepThreeIconDiv = createNode(DIV_TAG);
            dom._qrmStepThreeIcon = createNode('img');
            const thirdStepIcon =  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAYAAAA71pVKAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAFCSURBVHgBlVMxTsNAEJxdGzCdnxBeEOgok46CIj8ASpCQOCo68gIuCEEdfgAFRSrCD/IDnB+4oAhKcsv6TCRjXbAyhX3r3ZnZuz0TAkitTb9i7BfreIFsZkwWqqNqED/YTsS41WWnVjdxJIP5xfVzkLzzZC0EV/gHjqACxqziqHgkj3fqRjdogDod8vFR6t5GIx8n1rZkG5/1QgGGJGgpo1PPLR26i0szZrcl/ZCLLN2HQKahHDNO/FvN29gQ2n7Pk4nKkWyI1JN1b3kwHXObI+rDyf06BdZDmQQTOjZxeKcFDYixp5+yVU4NPUf37F6xHn4SzvmLU3HkgX9/z3lYVQ1BD+i0EPoNs2S3NGQYk2tb3SYB367A1+ZnJi/Jitm5yRoFBGOOcFDUVjr6i0R/DmHpQXT+VExCpuToZaY3ql77Az9ra8uU6e5nAAAAAElFTkSuQmCC';
            dom._qrmStepThreeIcon.src = thirdStepIcon;
            appendChild(dom._qrmLeftStepThreeIconDiv, dom._qrmStepThreeIcon);

            addClassQrm(dom._qrmLeftStepThreeIconDiv, 'icon-div');
            dom._qrmLeftStepThreeText = createNode('p');
            addClassQrm(dom._qrmLeftStepThreeText, 'step-text');
            dom._qrmLeftStepThreeText.innerHTML = 'Manage your consent with a historical consent log';
            appendChild(dom.qrmLeftStepThree, dom._qrmLeftStepThreeIconDiv);
            appendChild(dom.qrmLeftStepThree, dom._qrmLeftStepThreeText);

            appendChild(dom._leftSide, dom.qrmLeftStepOne);
            appendChild(dom._leftSide, dom.qrmLeftStepTwo);
            appendChild(dom._leftSide, dom.qrmLeftStepThree);

            /////

            /// IU for right side
            dom.qrmQRCodeContainer =  createNode(DIV_TAG);
            addClassQrm(dom.qrmQRCodeContainer, 'qr-container');
            addId(dom.qrmQRCodeContainer, 'qrcode');
            appendChild(dom._rightSide, dom.qrmQRCodeContainer);

            dom.qrmRightStepOne =  createNode(DIV_TAG);
            dom.qrmRightStepTwo =  createNode(DIV_TAG);
            addClassQrm(dom.qrmRightStepOne, 'right-step');
            addClassQrm(dom.qrmRightStepTwo, 'right-step');

            dom._qrmRightStepOneText = createNode('p');
            addClassQrm(dom._qrmRightStepOneText, 'step-text');
            dom._qrmRightStepOneText.innerHTML = '1. Open 360ofme Mobile App';
            appendChild(dom.qrmRightStepOne, dom._qrmRightStepOneText);

            dom._qrmRightStepTwoText = createNode('p');
            addClassQrm(dom._qrmRightStepTwoText, 'step-text');
            dom._qrmRightStepTwoText.innerHTML = '2. Open Scanner then scan';
            appendChild(dom.qrmRightStepTwo, dom._qrmRightStepTwoText);

            appendChild(dom._rightSide, dom.qrmRightStepOne);
            appendChild(dom._rightSide, dom.qrmRightStepTwo);


            //////

            dom._qrmDivTabindex = createNode(DIV_TAG);
            setAttribute(dom._qrmDivTabindex, 'tabIndex', -1);
            appendChild(dom._qrm, dom._qrmDivTabindex);
            appendChild(dom._qrm, dom._qrmHeader);
            appendChild(dom._qrm, dom._qrmBody);

            //modal2

            dom._qrmBodyTwo = createNode(DIV_TAG);
            dom._qrmBodyTwoLeft = createNode(DIV_TAG);
            dom._qrmBodyTwoRight = createNode(DIV_TAG);
            addClassQrm(dom._qrmBodyTwo, 'body-two');
            addClassQrm(dom._qrmBodyTwoLeft, 'body-two-left');
            addClassQrm(dom._qrmBodyTwoRight, 'body-two-right');

            dom._qrmBodyTwoRightImage = createNode('img');
            const rightImage =  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAACwCAYAAAAxDeP+AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAM4QSURBVHgB3P0JuGTXVRgKr33OqVt37r49d6u71d2SNcuSLMnzINt4xOABEwKEn+kl5A9gCC/JH/K9vB8e72UyCTZTeEAYgo0DAUwAG9vI8zxpnqVWS+p57tt3rqpz9r/Gvfc5VXXv7bZC8r8j3a6qM+yz99prXmuv7eAyj0OHz9+VtbJbqtLfBRXc6p3fCN5trN/lAZzjj3gG//NevoXzdo/j8w7/805/4U3UhN2m/0C82yfnnJ6Dvs/06D9nZ3ztTP2L9l+H1PeSvne4ZMwwuF0Pgw8Xh+r4g2AgL87oHH96/oz9cjKCSuBb2m+v8Pb6On1nVVXgsgzyLMfrlf7Ooex1IS8KPJ9Br1dCF3/TMxm+uDUywmPvdXsMd6e9i/NCfcq4vz78ToBDfXBNcDmBafNc+lAES+NMPyidToivPWP9GTBVYQ59nNv01a5+q5x2jXdCAo+hKCH3On7qAr7nGbzpGXzn/Ug/n9m/Z+YzcBmHu5SbDx06v3FkHH6qBPhpqIhgQQlUp6xBrM3DB6JNEIp/ekSgCDxCrAwRoarKCBi7Fv6pfSH4YzfcwLfWp361Ifv+dzSoz5gOT5pzDVSp3+xW6Un9dr1SHxyAoZ0zInbyBwER0q4hHmT4D8JS4WzMUkAu9yNI5TwCPM9z/jPkpaPTXUHY59BqFfgrgxLvq8oSCViIvUJiL5Gw6YV0zivWZ9pbY27e+m9z4ocTkR94djXmiy15YfL9x/A5Hkq8Q290gbjTm5s0PuzRBhcBwYmq0Z7BB55BUH0m9/DzO3fOPAPrPNZFwES47Qn4/+Jk/XQ46VOe55S1NmWNt86Fnz4QrxCmywRIJSIJSQG6tUAJQBy/LCsSKUTRoUX54uqcvX617whgcn5VqQe+3lJ4riY5fI0Du/RZ12gIatgcfwv1MxEaSrhAxE6JIr7Yabv0mTU7mbbMTWRB6jIpV1HjqUiScmNImGWPr7eKFmR5xg8TsXY7Hb6fpG2et+pABJmnyFRtHjy3GyV8IN96JxOEdeu4p3+E6zsGt+CH0qu13pxv1iXWwulkjk0bTNsyRh/bqvo7qkzQ6T147+9BuT5CXhMqp86e/ylkuD+HN25MXxxVXEi7Oniw2mmTBFEqAEsAG3i322HJUCBS5UXOqhpx/Iz4O3J7Q5agugEkhJy+u4/16VkhlH7YJwTU10bjcJUMPuFK0pYLT7koJ7QXzbay+mt0OII8Tt4BTYndL9FrGKdMIVziV1aBmCu9RSRuzlK11+sgobZU7ZUeE8x7SNzUQJ4jI8X76TrNizECYSby55V4TQuz8QZZpdfqo4mwS+eirkq7BIWMaflV2pLvDprqt0uejewynR/o600/C3AGXxf7I/CIBBt/pWweVGuy8VR1WWcg8vISpxIfCfkQzsrPb98y8/uwyrEqAZ84PftL2N5PR3WlOWTtapAS9htSqGhvU1tMVTxECpr8DImVn0Qs63a7otopAZd8D40tZ9U65W8pErkEhNaPlHRUTiSEmkpS3wA8NCYrBVNVaz1VG/tBKxjpfANyLoNBR+zxMDkBCQuqP1lHXMd2bdB2lMmSCkzwIpiSBKY/kr4s2bFPBHdqp1ch4ywr1o5oTngO2KyJmg9/NphKHVL2K6uz05qhmUiCxlPpnIAYBdA0WJrznT4R76ufT+VkXdwMbquPlAPT94kAS/hMDSZO/3fht2ldLm2sr9dVoHCE8y9t3zzzMzDkGEjAh86f3zjWcx/Gy3fBZRz9/CtyrNSBJZKhYk5PThNCmKonDpUcbTAicLrOCO8TTmU/wOzBdOLTz8SZkk6+MXK7N2GJdQJJOTs0nlc06PN8QPKszW7KcqGBUPStks9UokIq3xNU6zNVmu9jmSic3ri5FwIlIiTYEpOshIOGR6lHIyiN6R5Rw+VaxTZwpQQLQZKk0kVeI/1KjYKEHTZ6mpKoD3Q8cEwM3qoGEWhAD2AwKffNouEQpNrTYN2r2Z1a+0FCpY5YG6vrYxpmAsl3t/qLdA7rAsDdu1j41+2fmbnQvHsg2E6cvnAvftwakWu9R5QhrvGaqNKpBCZN1JdRGuHAWmj71hAgsDibcK+qXAKIBodbu3/Jrb6f9/UdrnnRDRqyXNHvPrLpIRPUbDaZcL6QJW35vvc0OxZJV9HHpyaLqL45SVr2LPdYszHVOMtEApc90XbMJmbCrEBtZS+ErY2K5gNJh5LR9MHLw5AL0A9ExR3nazhcZ3hrtdXfanwmfdY+aVxV8sSgI5Xfyhi9rzEKgzn31om2Q07YiByG027YNCYMO70Q3vHpHVs3vm54z/Q4dfriL1XkZdZBuYSAIwdb31EDs0pcQ0giRLqDHFZ0YwedJ4RUhapxdJjDJFMbrZJGBOyqwsl71iJc64IfHAIaRKCBgnzjHjeg3ebZJiNrqne+j+NDo0t8Xk0Ts498rZdpa+l7QLQCY5QMOFKBc3UYBtWs9kYOPSG86Y8IODNnmN5lzsZ+xqljU2nfB5/UcRi73DQn04FBY6BQV5cgeX+Nv69xKL6EMIIhctpAvZG6F0M7bSaUetUz1UzIM2+SmZglmSPELO3VAi25v3J1f3zofkA5nXdwyT0M5V/avnXDzzRGFY/jp87/EHLl35XBclAC2u0RJLJc+9APyAZMB8PRQhg+TiZxLIo3sk1GDhWKLZKkKCiE0RKCRcSjWKQQrALBuH/mFCRrzJ2LOLTqvQ5WdVLDKuO+1LYG4mjtDq9hGUKMCkM7XegQMjiZRlaJG09GySVmClme5AykcBDDLMuCHWvvYiSsRD1m9dqTei1I54K9K/C28BU4F147CAZGb83xh3svAXcSeh98XCIe9vFhv0ZbA3AnqM/6SYyRSR1/d3s9Pt3iKAppO12dF3peZyxLbOtEGlu7JUrtpeWOmpgucRkohyyrn9mxY+Z9abf5OH7+/D7Xc5/GU/skYaCCifExGCUvZZZCp0bzMBzsEKSADdgnHmh2XuU5EykhqPNRahHDKNix5fg6EXiIgSYevboaF3vjBorYQf1unqtfhVpbw+8bdk+TabhV+pPe41TyG58mwpqbX4IVCvHwwLMgZWMzpt3I+YmxNjNfk5h0e565cD/9LtW+zYsMWnnBz/Y0xmvMEgLMIUQB+sll0MBXg/1wCA2/Dy7hnkH3pf1Y7X3DcceIzCe4bL4bxlWEJXnwiXhJs+z1epqI5JJQYMMRGCQ7qPT1yKxLmJ9bYIEn0YOUAOH8UuEPmD1chH534efwzn0SJK9gdLQNo+0WmJMh9TIPHG9yItoGPrm9inoCDYpUOj6HxOnL8LSobhgTLr3GJyvNOoKgNim8YrtJBxw0+9n8bHZ+8GDcqvfBKu/rvza4LT+kHTsRuXOOMBnH+SCEKBlxdMwBAdQ/oARMxDiKxJvlTr3JiooegvOQ54DaxnsKtoO9ZGOFDC8PZqU41+y/HzCeQYNZDfaDnveDLztY/Z713lePU63Slt1X779AxYi4lKw0nBNJiMkYluwArDzjtobXYzvOmLMSr32qU9Le1m6hYBsbhYWFRQmh1ns6M97L/nf8/Bnrk0nfQ4FCsHMbN0yi+iWqswO3Lj5qgw/DTjmWEnOlyMNqudpZBIRKVblaEoceKccaFL74H3WsBpNv7XC1t3iGG8DFuTnUVojZpXHkaKeiBcu4MDY6CpPjo2DElsq49LlUtabfPUnTqmk73Bv3Pxba64Xzeu67/La8qrTCQH1wYpGp55WAi6B1ptphkOUhCiMaqPgB+jUFapXwf3Z2DjiXqb/Hfmneb9q/f+aCSGCRvqBvl3hfkERKwquMvE68Ud0wc6HyMR3SJEHZo2wfUQ3I8ynhIseSOXJ5rz3IVOC4fmS6HCpKnmlooZfUllutrcs5+tpSAtRMnozDaSWYRpXKh1rMNyCPPBvgX+u8U0+003CeqHJ9xJv8+3yM63IOt8621vOKy2rLNz4T2iDpm2WSv0Bzw34dcCFEyjPndI68EDunoKokhgHM0fnUSesHddONjpOjGX4u0468Ju2WEV6WPrYadIJNADX7QBI2PLvURc0omFjJSUXqHUleZhWZk6wfUqvpuVJVFpfF+KNr8sN19AsGSJ7GM+4S2hrY+jpBtK6j1pYf8DY9ZzZT0GwiNVOYQ5IyxA6TGHs+UIpyjJd8DBQRqJJcazPJHAxEsG9lXP//2JZnqELAZ1tgQ3Blx6JqLeTLkchJeJAdWUTcPU0VHpw5mJ4Rwo2a95BIeubeQ9+y46fP30W2b0QZx6rCYMwfjFQ+fOo3TdYIapqLoteMeiZWsiFKUZ+ZYxEy0coYtS+C99NG4FJbt2k7+QE99KvYxCk4+kc1+M5BT659V9pm//dh9/QzrIpBKhI1ekPtH/U+O3GqcFioErQjkyR6Mq31qA6y4yxL5gmSz8sey3rvG3SPv4y2/JDf62lr+BhSXA7MEhQv2UVDTtZuIM4uE7FEDCyjUMxcHxz4w6DalPryKgf9T/GFjUS7Bb75LuAgfbypf4VN1QeAYJyL5gW+ESKigxAtV6KrKIGgFGeVSIaciZjyn8vSxzS9zDWI1qvNu75JcwPV0Mb9fc4MGNh2f1vD713f4Vf57gZ8B4iKtJeFCXqLbxB7pVlrlMFGlE6cn4kXowh0a+WrwJZ4Vg2ZXHxeJAoI4+X3irPMrTGWZly7Pow17hva1t8mEevvBujrPhzF6+DjkfRf0WBKsWlVOBHsqRlOnlFcczXqlRcNH2cidoghV35gppor4dYCbc5blB9LJ8lmAnFfRwJwAekNiRihZPUaZKSBWYdYmgoyLa90ESlaEhZCgi1VNfbkLBnRuGRWQKezAnd/+tNw550vhk2bNgYVgt5FTKDI8yB9xUHgVJpDTTWMEsTAYDPSmJmhlFgb8foeuewj7dNwnhw8+cqRqzB+bcNDsLdkgjK+J2OzRbSpUsMZxDjNA81zrkh3cW4ePvWpT8HrX/96mJ6eUiTs4fx1uGcjIyMa5+zys6PoJMs0Dt/FkMfyygp6snMYQc/3Cs6lmU38G9ug51qIA+2RNs8jSakVegZNKWqbVkBR1hKZTBz6yvIBMBoyl30wjbAbDu818CIQbLw95vE7XWAjDxAcaPmlEW+BJgunBHMOQ8VNSiKS+ZXUJFwVoxQPvXqgk5UPkbEiXTt4TYGCfh8qW2C8z3EH43i8JqMHosHvFOq/gABf8GTDZjCKrrKZrA0tIuiMrmdw8tRZ+Pn//ecx/DEO4+gR/c7vfDu88JZbeLJYAqOkIMTqdLqchfXYE0/CzS+8BWNgFJvscQLC/Pw8/NmH/wy+/du/HbZv3cr2BT27ollbXiW62df9hwtc1LlVYQVxxN8Csa4mSAf0bV1tGfFWEIiPJtCRxAUfJUJKyOqgopO9rhBdrskFpab3WQ7zoWeehff/8i/DM4eegfvuux/+6T/9JzAxOQmPPf44vPe9vwhtDGe84fXfxqbOxz761zAxPg4/9CM/BHfcfgcsLS/Bb/7mb8PDjz4Cu6/YDX/v730//B+/8AtI4GNw++0vgre+5a3wm7/1m3Ds2DG46cYb4R/9o3/ICTu/+Vu/BQ8/8giGukbhJ3/yJ+G//fmH4YknnoDpDdPwU+/5Kdi7d+8AGK3F7AxuKRMfxiSHtKWAFOI1uCbmilNnLkh4LneiRbZakoyU1RyDol67TBdzJPG49RCvaLmifab57ymLQuZxC/m995lAd9Z9XxsRk3fupY0eNni86sJv3vMZeLw7ywO8bXor/NjNr4DNHLXKWG12iDe9hWV4z3v+V7j/sYfgox/9KCwsLsCnUdLSJP7wD/8QfP3rX4cHHngQXvHyl8OpU6dgcXkZfvn9v4zEfxL279sH+/bvhw9/+M/hzOmz8JKX3AH33nsf/MiP/ij8u3/77+A73/6d8Cd/8qfMsX/wB34ArnnBNbrA/hKP51O0usHf16TlQfeYWQJQU32J4/dKoWj2zycOqkora4g9Jg/SdZYStvie1TGBE4Uo7n/wQTh79ixcc+018H3f973QHpXw04kTJ2B0bAze9a7vgptvvhk+9KE/hKtf8AJ47WtfC9dedwP36Stf/Sp845vfgHf/nb8D+668EhYXl6CDkvXv4O/rr78e/vKv/hLOnTsP73rnO+Hqq69GZC448vDGN7yR2/1X/+pfw0OPPAyHjx6DO1/8Erj9jjtg27ZtA+ARJdBwmOmvJhDXAe24OCH9HbUbyRl3QU/NfBZU51yXuZJj1pquLF9f88cvJyQXfUqu3ziOx0Z0gMPGmnnM/Y6rP9ilDaCZP5718R5+nqhW4Gm/As9lJZyqerBCKgOSOkn9kjqJyLGIkvLDf/NR+PyXvgi7rtiFseWNcNVVVzEh33PvvXDq9BnYvn07vPLVr2KE8aiO7dy1E67YfQXcffcnYcuWLbAVJe8b3/QG9PD1+B5S7Y7j5+LCEhx+7jCrffsO7AeNNP1PebjLuicmVJh6JraUePTZEcie5jxU1iAPP6u/3V4wL+h6pk4tK5iQqfFL5+9EonnZy14Gh55+Gv7T7/wOnENiphdtnNkE+w8cgL/++Mfg93//92A/MlOSmL/zO78Ln/vs5zjl8vjJkzC/sABPoLT+jd/4DTiDz956263w+c9/Hp/5z3Dk8GGMZc4yk/6VX/kVmL1AyUMZM4KvfvVrrGLf8sJb4aYXvpCZyK/96q/Co489NgAebiCE3MBfHi4N2omdW/tT4qUe5xYKMiYquc6cw1CWgdAFxiWHilywe2Mm23oPn5qtSR8HsPmNthSoNrSUI3ldIsYZOqT7E9ehT/wbQYQZodAQOaT0OYfSgZRZ4lqk7m7bshne9rZvh3e8/R3w8Y9/nNVm4laUZVIh4V+JknZqaopVkoOHnoZPffKTsGF6A3qjS5YGhGSEGO12G46iKvbZz35WEAE7Smr2fiTeYqD6rP2v1reayq9y3pA/lXBV0i5NmBBHQ81ZDy4N60dIGpCfZViFJVLVHIF0OVYzkRgjoQuFNNK+cnkiYwSqbdF8zs3Nwc6du2AbMtJDqEafPnOGEWdxYR5ecuedsAdV4yNHj8BIawRe+apXoXo9AU8fOggf/NAHYQpV7Y0bN8KL0XdBdu0p1JxeePMtcCOqy0eOHIY9qApv3boF7rjzDjh3/jx89Stfhb/8y7+AD//Zh+GDH/wgvOIVr0QCvwA7tu9gJkLm1Bza44MBMvTEJQO3FjmpfN1Z5asaIYMSny3DNLg69TLz+V43LASpTHo3tQXn1iV9zYwVBcCvwv3lQv5P/tnP/lz8KZm4ZIOOo+1DjgeSwJUSMa+i0P5V3RL2tafhptYGuG0MufXERr6QcxUcz5kkDp0o73r72+HAgX1oB4/D2PgYHHz6Kbjiiivg+uuuhS2bN8OOnTtg186dsLi0BC9/6ctY7VhGVfqqA1fBS1/yEti2dRtz+Je//GWMvOfOnYNrr70Obr7lhZysfzMiy8TEhJaKaQIDwKehrIEAS/j7IF0Xn79w/gL8wR/8AZw9cxbOIyLS9+PHj8MLUJJQu5/61Cc5kX3zps1hwhMY97W7mkrt9I6mHUZXSNpVpharI4T8B10ufBDzxYmx8dJMX9WYcTNJg46LKCHvufceOHjwabZh70CJXKDEOYHj++KXvsT9+d6/+73MRL/y5S/hvByAt+OcPv3U0zwnM5tm4JuoRr/8FS+Ha6+5hu8heH3P934PvPKVr0K1ehEeeugheOc73o6wO8ffN2yYQmflDEtnYr7ncU4feOABbO/lqKLfFdVRGASotYjArXqppi37iCPio03grp54W1pJOeIc41WCz82x6k3ARRVZHFsJrNchgSMeemXeqMEuLg/If6hHZNyJ0xe9+JDtXylsthUBPNYWr2XPypGQ3UUeLJSuy0UGHQB2krSQC42SJ9pVUJCdTB5PlJis4iVdL9VucJAmyCfqicsCsprqb6qgVZjgYncJZ6yZnQOI1HJV12t71IClsz17cRY++IEPwoMPPgR33fVqJJgS/hwdLz/7sz/LkvD9738//PzP/xwzpnwVbWCdbw0hOlPj6CBN7Qwieg8RqGi10esr6Gbre+l7nhWcIEPMd3xUKkhmrplIb991SvGPPMePPfYo3HTTTZoOGJ022iX9Gdcah98gc0AMO0sWS5iUt7Iz1Mg999wDY2hXk30MyoACg1KPuFRfyVYDz7dkK0VvMgTii7kJQjgmYYlgKY4rXuYSHbA9qJRKRtCjnun66rqQcIn6bFC49IMiNqfOXEAhmENzIWkEBPigQvvowgJV6sMDWeWk4gJ+einYAON4ZQqJcRw90S2QNaQjiFgZEi7VWfLIBIBynF0KOM+J+XSKVsZIwoEgBDm/nNkc7O1Tm5sf1jRLiFyun3hh4OHqA4ZBKtjQM9roNKr4r3jFK3iCv/3b3wY33yRSn7zk73vf+1hy/NF/+SP8vQCXe6S2FySfZgMbwlHFEmKaUmooY0nLmW1qL6cwyhKpUEcwCS+pKYy2bRtt0Vu4LbHxBAlDdoCqJ4Yl6Z8dmSWCeIW5Eoo9T9dvQ/v4huuvk3YMxD7OZ+aarfbNyGUQr++DsVTtrCDNrDJGI/ZtJmuiaYllKeVtKLRVtKRyjGQNCrzNxs2S/IWYhupW6Y/vO58aYGH+/eAMCDuK8ACkK4haHEDmTuhEcmiJFh+Qd0onmAbTRttIuLxMN9+WS5I8q3Yksimul9gGvMpIJ5ljvHbo4obowFEABAmdIIddACNyD2mlMInXeegQFyV7JZN6WILnmtIWlnFR66U+niev7cl5RyqdlJl57NFH4f/8v/4v+PEf/3Em4PPoZf3IRz4KTx18Cl6GhPzKV74C+p0kTTUoQEoJMy2pk8YgXXAqEnizfIT9DxR4l9xbWVNdFCOJwytnKW2TlwUVzuupCFP5SGAcumoRCYCg6TiX2NAAkDIMbxU7RIsyTUlayILNySGWFA4e4lJV52LYZMBxOXLMJ+ML4USQOKpXVVW0CC+VXhipyWyUFUUlr+dVVVp9DnmCr+wHEd0bZHF/xNP+HtuqORd6VkcN7af1kOVlDvFtzcohcn9hQHYJByAkAKgvBzROymmWUp9U6iyp+zem5YG4z2k0meTYeqvuwevaIkKYfZAe/Tp/ik6u/54ECJUN31OopYJFDGlQXrXrVqwKjY8UQZoItmZJGy5klPHiiSD9ZPQzG2fYPvzGN78JMzMzqEL/OXzP3/278IcYXnnm0CH4whe/iNdvh3qBP4BBqGf82VRlox7+WaXzIIyOJAKPjFVkiumWjHCc8UNz4Og8ja3CMI441XwWebwxi1rSS6NvTvS9dCL6em7PJzOh9O4arQ77DZA24FwAfWh/kLTpZ4HruzjodGXF/liQiFZH2M+VOJ2QCJMKoSqaiRUJIS5ykLFggkSjDOE6XbAgY4AhnRzQsyECOk3c4KSc0Ku0LWVIJ05f8JIWJp0kHb+z7DCEMwnjbVfjjumywCxZlBu8tGo7mBOCy4wYl2Y6z/Q5G+zl8FUbJdR2b/AsvQV5V6iiAZ7PaZVTJdKg5DXGXVTzW9AeyfX99jxIofBMp9ZHyV6pikcEs9JZ4jFT9hE9RJ7ZEbQ1Sa0lTyR5yqVyZq2nw+ZJVWUfYGhX7CsxA6naibODc3j69EW2hdujAnsiYHKujLTGeUUM2WlLyyU6C0dgZsMEr6O2ckRRCl8uzP8HH99K133dOcWmmcbH6Tv7ZhCWHCvXBQrszfdS1L7b6XLGIBE8Hc2Y7tpxXh/EY2OJUOMuCFoY8YxTZy4y08gdCUbC2b5yw74IjzoIThNzbkRE0sX4iQuv5FxLW6MBrHKwKp3Z6nFTJ1zkw9lqg1zjCEzJh/6abAHexQFgGQHdQ2lLDCRnaa8OCvxaEBW4ghF+BZ0R7TZl0IACRwHr1c52EQCZp5BMB5548nFYWlmCKfS2m4ODVEJae0uOOfKck0f4FoxpRtEyHOecj1OaOkEqVn9jKMORZCUdBpkPZbER78g4NbWIYYwuOerEDCCpbdqS1Xt2DQn5fJLx31pb3xqvrzFMSeFV4iUnIHmYqRZ3TzIL+d8KOArDJYnGoslXlaZNRu0j1SDq7zaTYH2dV7KJP8A1lvFGwWJHYYNMkc1DI6LpUwmRtq8EyeLOcptF1EtFPoh2a5AEsM4j5TPKDMJ5CPYa4Xu3gwTUk+0/aEeBzLkwVJOwzDsQybn6BBoYyyslq9kkjVt5LGxeOV1u68RpQxcoV/vixTlYWFqGpcWulLbBS5s2bcLzF5lwp6enWTJXumXJWuP0/cBUZ4h4nIVpxhFHCQKMcLlmB3GRNLC9jgxfjBEBDNJJnz8ZPGCd8f8kbUVm5YfexfnKpW4TQ8Ajpki7ViB8KW7dxijMps0zIJF11c5qDkF5SzQ/gvETSkSB3kXaFOWF05xR+V43oK/Wnqn4QeMN89g/FiHg4ABRQvXKbYLUdYmTpPlOMWZyK0XqLRgOWmPYhVesKXn7uI19FWnv7Typyl5SCpeWe2yHk2oMmQErNsH2d7Dd4jKvLGvxBC4uoVpdSHEBp44uJh7avcCz4x3aE9Nw+20vkVKhrideg2BCeB2rLpxfLQQyaLym1lHtY59p/ySGW6pZktt6aZLGGu+F1B5l/piB7egQpgUcXLaVsq7j+Wx8SFtDbZBIUOCbTTQJAoIkjlJKpCMtqKA20FsCK2QW4by3iTm2clgm9RlB2malTAJI9cUz0qDtkVXpPNYElU4QLWw4j0KAylRx0UY3eJA+7b+vqQ8w6AgqtGjJ6mZPRhxrBwsoqip1u8cOmP0bFzyvZRcMOFbTn4IqIjsLUGollZeh0JV4W82JFTm5OaBsEkW9VJ7ppdaUo9UwqJ6S3UyZZaMFESCp5I7j2T73bF+2kBtT3qnPijApPlFn6F3iXF8/UqeWETtXSq8xa9CVQ72gqpOEIJubzlEl3kxXvAh8aVxVxOPgef5/wOGG0bAL11Jlo3mfb35Tbc4yoziUiU89cf4UfOyph+COK6+Cl27ZSzYXZD1JjSzNrNICEy6hUNcQZFKDw+tChnhdfEe+QYdV/5iafQ9ywkH9Yfld1J0nKoUDN4mFv0n3l9iYqzmsbBSpM8bU6FTNhiGe4/UeVmKT7FwiXIpZttuj0pY6jbN00aTCXBiYQMGrnSsSk2AiSx8zJFwkUZjvVHB2sYS5ZYBDT2OI6MxheONr98OmqRaonhU8x1Z2yMbNSQD6lmGDq6WoBodgnNSwqJ45p2f7i5JGhIghVDtkh1VI53SRtym35p91C+TSifmyHvrv01b6aNBM3Vr3pczVHoo4KiaHEC85OJ9enoWPn3sOxnZtgTt0fiXGpTXJs/S1g3GaTRkv6jKbN/Jk8kQiXAAGl6lq0qmiSP9w5aZCvnqwwL6sWBGvq9MoFBv5VLXfFUHKRq5nCBzr3hoSmZvXuhy630CsVJKFYSaDI42g063Y+URERBUXbfeCymxVvj0LNoONR1Qcg3XFW3CyE8qLZ3cOPe7nZrtw9OQ8HDrWg6dPduD4eXRsdMZhpp3BK16WwbZJ4QbEiSXcqWtCBzgt6iuiDGHib59MisV8Td21FUNU4YFT+LCvpG51eys49i57uns9z4wnsCTqUGXxzKiluDovW9chtptKNrfWc3Xsqy/+12vmxNHOVHo+1ZLWS91Gg9SvJSS4sysLMIYmxabWGOTNthTepknqLID5NMw0pMqnVOWzh+dK5uroHES/7ijCE90qfC63Os7Br+DCfKWYS6eXVjx84/5jGAEYh+uuJmenLULxg5lOSgyQaMqufhOFB1OnZ0rlhUjdUsR/sF/zwLXM21YkRdjJtU62g6WlpSjbjCe6wIWa0dzkNlVJ5Wul/2bqsCHCLdkGGSkwZFOQJVtBUZmyIoxD6SrhWF45IghS0kTh5xIygrMXSjh8YgEJdhEOn+zB2VkCfo4T1oZeNiHIi5M52xuD03jtyhlyY1eQBldrEUsXl42lR2plpMnxJiotK5G1Fk0Q4IXz5FUuyT4TjYdgTxqQJMyTZxo4lZJWJskEWEM5WP5UeNWQw2sH6R5mTF4yjswOX52ufBygF7h7R05LSyOVpY4KduQvDswn5/A+zh4I2OrXNrEYfYSBEi08sbwIv33/Z+DGmW3wgy94MYwFHuFj3yCpK0VMEa/npLVkEnIUsKntSloll79pIY5hVAEvdwMzFhhlLqZUpHFum03q4pkFgPd96DG4et9u+Oc/NgPTba9xXIvi5pKW7Pr7aQzZh3MqiMAqslQK3wpSEV1UykN8ZRkp8ie2rgSQefdALwW6xMtaqCpd6wekWT11CyxLBj/4MOSukj03lpa77KiiZXLAO8k7BrrUykVG4iiRocVLHEuqa0yZK6S+KBFTHs3cSgYXkWBPInSfOrwEzx3vwMkLOcx30fb14zz63BNCRQJSWYvjy9EbiY6u7V1ojWYcqhEbyHi6jSfNshk0NvlH1DoPqYMy9ScQzCpfqpSQSv8tdbK0MkuugaQPLkgVfj51oA0BdHy1IlKVia3G7neJhZeMtERowhD6m7IXMosEYN9twWTL5QK8LLbo8UAqOFwu8nrynSgtC58bh2Wios9iYP+Sc5lX/0bF2sdctQLPoEd3A/Z9AWHRxmt5w0YUmGv2GDHISlfUUSIbrefF22d7wATVLhyvqGNHKEgor2SmatI1EVCrMBtiVB0Yw+fbDNpHZ8/AMwsX4NbNO+GKbJwlfQsS5hgW6ruBExUipjWPtq/dVsiO7pKTzHo7c6KCvcqkNue2O6Dlg2ZSxDp4rM24T95RJ95EnYJInM1Op9vfrKBneaXb49VGoyO5sjhyOFQgBfecGrEjsvrJa7oezs5iSSpxCc8eX4ZHn+nAoRMdOH2xy+dzP4FjKXgyCS1bpGngb0LVbibLJVmqh6qPSMDz2I/WKHSQmUDWgdHRluTKQi5csaZwREJOV7RAQrSyhYkySFuSSLCk7+Q4yaz8UAlWgymofdRaFrWcFILOQNyEq+EK1FlMUHZthRnOfReJlki2oDI8rsXPNDYHrbVpz6uYFS0oI2IqdV/2HJ5DYvuFb34cprG9f3bnm2AjEk1nqQMTGD8vRvN05y3oxxyDn+hazlgrj52eLLV/ojXWFlv4mPopiyzoeV2hVXXh4nILfvmDj8OZ87Pwv/74S8BrMcWeLbvUnIDg64CUePvx12BLb+8iflzEHx87eQg+e+wJ+OlbXgvbpycS2tPJWq1WMwQDLEDG7oxbGVAJH96EqZQaSpqEQeoEcf6iEPc3fUq9n0RKeQuKpyjhBvQn8HvwWkUiTclTWDOC0qqaZbRzqVRJe2QULE+VZkxUD5RIvRaTTkn2LHLgZSTMs0hkh88swbNHkDMj4R45U6GEbaMdg0hYIdd3k0joqorw5snA3NCLJ4t7wlwaANKNLEm6n5tDrYMWarg2cuUehp1W2FPMu1ZkWUj4t0kVrbKKWib44DPg8q4k8TNBQEbBUhCGPNAWR5eyuzlITWHZnYJrDJParOpkgK3ZZhGaA6A/GE2EL2Js0hdgCXtdL1KT6nKE0lQ1FpDy4Cxc98wAiQGQ17YFizg3LVeyND9XeK6DRrNf4fwuYzydtuwpzHpNTKh63+UcV4SpNDpAcXLQpXyVwHtuYRFKNLOmkUgozi+quzDjTEODlWkqTjaUX8YfR845OH0WIxoqcWk9Mq+bdrE7ZgrUAegGwpIjG4SulayJL6qctZGWzzirXpYK9o9y+FGXvD6Fv54rLM9WUsdwAtnGlVusYr9tui3ezrhbe0CO8GUwRxHtWNHcixRl4nRCVMQkllZWCLU5VJLujGfciuSkcfk5tGMfPjIHB4+iLXu8B8dQ4s4uInKskPqDqMeLD1rMcdlZQejphFNLXT2R2C6jmGpXpW4W+mnMhu47P4faAL56DKQyQ9uNMtEtLHa42sVoW3ZXFO921RdCq4fbogYi3n1BMNlsW3KbaWECMUVmpqzGe1GrwQruewi4mITWbIoN3us6Ssd51Jy8j20RUn/iuSfg6PJZ+DtX3Qo7YFxbH+BbD3glRFxCpUklGdx3aBY+8sUz8IaXboZN+8clDEOaB9mxqEWVztaYVyGXvg9nau8rmcFw7WodZZeYcF7y3HY7sr/WlFcYVGLLc66zk6WO5BjkrVMz8nUUsmOjJ4zrQB5kHUAaNYlEDOBXITS7krFQxXnMxDHWQWruqnPRs6lQrUqu8V1eVSqX4I8bcB8xCW8eZMfx0A7aFuQ06nWREEZzRbCS1z2KtNVOhNiwNOcGvKT2Nr2L1CqSJlJilrx9FWeoUEhIJjMBYMqu1IFE5PaZ+2fhvyGCLJYbUCKhBVT1eIJ51VCmA4eoZontRJNaSJlbFjL0T0sdFB5kE+lSmYvm3uDn+YVlWEYGM9bKdGtIkAJxyFlp58D5+Q6Mj0q6I7VlCS3c5TREx/xAlB9CKPIlFFpojvpN9rU4qXrsWzCnTIwyuRoszRkWHR+gdna00e3d9QdDj5AAqDgeWq+slaBUQmS4Z/YU3H/2KLzuylthCznLXPPpaBL5RJMKeXLY3pGTXfjYFy7A1VdMwkYk4LyKiMlgz3xYZuoMRq4fQeN3D8+ihjW7uAxXbptSvCD86YIagKLFewgFGU1QkH0uISPRfmjOupUk6jj0gWS9CYYBMwhFP55HgKgtrkNIqpXHDjCDOWkL3UKUvEJt8f62hqnRHpoS2KDsIc5qxjv/2QVDFu9DmRZZV5pBmkLGqmNClPql8eJ0AvS8WuVWjoRSGUltabfHNHc5pj6mT4v7ImNSPIEOqS98cx6JagsiC6rIJU5ENYlXRlUNFAcF2cPk5CrzbuD6ZUY5ryV7TCmWmqn9xqEEJVgekZeYMfHM+RUqm1qpnRp8vKIKF1LaZnF5RXwHmkIpEtzX4MLIW1rcVrz5HS3BKnaaqM5WfCAt22NIFUjVmVx0UXZ4X5+GFPp+MIKYfbuEmMZDpCT6XHLGub+UqbawxEkzcVbT+fYh5ZSDXqRCklrH2swoa0CCgqLlidQV+GaG0H3xqn71oYft/fEnT8I/e/998MjRJSZdfhdqW5UuwPHKrm2xgk88rLzdCf6VFW3T2sETtFAf+4HaExGcV0sq+BCMaIMU9gP7FcALkBAWMkREwBGVxpasQ062qmZD15qIo3d2ZjDXaPaikLKjIjkKtX27Kw2z2QFkoRKu04ElL3B1fjn4tfHVTo0M9gCjykx4zRKJkvMdQFywlPJ9RHh87pNfvwiH56bZVmtTYj8iW5dUKXbGZFCXOJT3XIB5UkVVqiCANSshuOm9lNPl/RjJ1vRie64geBaXkLynlJXSvsn40eWtOYG35jTiMrPCMqHEGSJ9Ea+953KwTkNDoPem2Wvi5FLnkcHJubjQIiHUiDgaQfCGwA3wD5gSGh8Vajh4ugO/9WdPw41XTcHrXr+dk/qdl8LkFLK6OL8AE+OApk2aNm8vqILmlamGVGZKqBlGEFQ7Fq+vjIHsQrJnM3DQXGQx7CAG0O1MIiOZQZi3JJpfkRNSarN5jelS9MS2BCRNq1TfjmICXx/hZa44p9RXHKfPqpDrDDWh5Ooyya3exwS7w3Mt8ktWLuBYWcNrX3u2/q56XrhPOYSrP1vYTuJ0inJtc7TBipbUEeZMlaRIdFgcroNZ/6oik/FVDTiSySREQFhLiwHYzkPbpcwl9BpkDd736JEOfOXhFQT8BuG76tElieohS8ao3Ndnqlp7Vas9l/3xlM+Mz1RFD8STXIUNw1YIuVDVHq+ELffQ2Lq4SLKf7i1Yc1tBNdchBx9BCUy3pSkMfTCx317CGMyoMvH0K+cIBdFCtUMtUBf3hop/FvemcYtdr643VYO9Jt8M5+HWL6lxNouY/I1H59BpOAZ3eUka8LnGhMEHhBH/QJLdFBqivZ1bDASPjLTLlUlpNQ/ildqkwbkDAgOqWtpLDcwGrjQP7gnPT9xdoiCPfQsZAq1E63kOSrAAKsTvQZDqKVxZq6EpbrVl3kHt5G4n4EzuhdAFNwCk9nYu41LTMWgzQwDLMGdmVfA7OEIS/OcUypIwVcqCLcobEo8chLyPSuPlrBHS3GfCsNIOFC2UgDkBnsrfMPbLUrVCAVF5SwVLVAs+sV7ibQ4RapwuUxWFHTe0LyraKLSAWraUEGlIOckX5nP46GdPwoXOGL4aHV5IZBT3pQLUPqi9CmMOD1E8lSTzMjurPKnPLRSnIzgxyBqzUXznGBLiCE7wGAJ7BCcYRUZnGf/mPaxcxDYw1FCUS3AGwx49GOGlihTKgnbO/lMneM7SJU1j6B+2gzT466OPgs0IIuq4ikuzrGp5t4JkvGLGlTblikwSE5eZT9aL1th6/xEkAsHY4dicWH1ZlbETkxHH2c4AzSeFPRizEEDoOlq9JSfHY8hAcoHiQzUMZerOgLHqIU4pslUp5l9QJRKQsbOvmSqjuoodf6zlgICFnIykRZS9nu4IKMREjkx2wZB/x2VBbXUal/UakXBqZDjr5ypHMGbIDFEzzlR6Jl/C04wMtTxqaQES+s1lUbvxxqqyoOWIklDPWyyEeMT+WkJbThwgEnvlWCV46FtCtQ51wq3rinEhsRfYNmo5Jk5iKOhTgxVEjAWMHX7hYfQ6H0eAkmfR95hjeQyBEFCYiJlIETlIbI/Q1i14TxulQxsnbwylZRsBMYohKmSCriBvaJdtZMh7bBd3rKQOLRrA+HJrZRz8CjKJ5WX4Zu8IuNlNsH1qE8wgUozg+Df4PJgBZiu5EKGLmVlBjXaWGSQLyItcFbekhnAIw9mH2bqqftbVYwdR5VANY5gKPWRWTKKyYaGOJceF+TPRVDQclm7M1WxDMrcqEbE+0+QPmhtJqiE6YaMla0m9cLqDvL9VM/w1rJfmnKJQTC5ZXXhuBfGDIibEhBytJFuRTDViiNRfyiO3ovZd8vL3VnCMLakiY+mikAVHHM9Y5kKNLk0bERsZaOGLCrEhdCy6EI1L5puy/jqtLFad8yQMlLEa4Sa8q38VW4jUp6fUMWeaFxIwEUqhMceM61hREmhPa9xmcdMxa9T54ZCO71nnYQkOHoKDzos3j2oQkSv+HDqRzmGY4DMPHodFVPO6+aLEo1H9pYgRSdJWG2XBKE5cG7kweg+qFhJ2gSSZ4R8SKCHnMtOClE3RjGk+MhPbxJlpY3F8xqOE7+Yr3LafBngE73728AnAaDJsQka3ZXwS9kzOwNbxadg0OgETOYWZvMqkeuaSCR8TRoI7XhMdxPcQSky7lGh97XkFTQC8C5+Jh8GQzK09K6LW0ntK7PsFZloElXHkaZMrwE4maVySSWRhiIvj0T/JeMolDsxKAGVhIU65swiJjSghJmEa528a31PoQMwj65WxrSUO6LkRP4/2K7aZ7WM/whQS7OhCl+uUQ/BEl8F5SOmoIyNZ2JWCsurYtOJOSy7BqLuIf+fQli65qur0cg8mSg0HuYiXIU93iFoTldIK2tk8jPmLqK/tRBnSgykMDXJiCxM3JAp06iBrCDUXowsC4yRkK8o4GDa4Zw6f8LTplENEolU+tCFZ1Slgx44pGB/LmPNcnt07YCqsmJwOYwUnge0k5FScUA6yS9MiTvYyTsx51AiOLi/Bo0+fgIcOI2FifzJSX6lWERJpdwQJtFhWTkY5rd3o/dXcXkY7J5KkhGS/YXBq64BIGYaUqqOcsplz3I4ulhxPXIF2JaEo4uAt1MPaeP9GVD8PVCPwxquug70bZ1j+5Ak39ck/aQKMeeJta1XrU1zhlRIoSW0HJ0/PYYiP1i5T0lalheMyhhqloFJlkM5yAdPTBWzZOD5AM62r8fTz4mIFjzyzBBumM9ixpwXPLC6i024RrsOxTKPEot0ycq3UOKheWeAuToioRJgcv9iDR48uw9XbCti4eQQemj2HsAK4fuNmGCOHJRI0rbelGFUODZJI8Nnmkuz9J46UcOrCEly3bwxW0Hv55IUzqA214OrJDcwyC67QmXNNc0pMIsjRzg/m8feahskwQ1u0g/B88NkF9Hkswy0HZmAeFd8nL56FKyam4cDIBIY3e9yZNvqEaC4yZTYwHKQwh4/c++RFmGy34fp9I/DcygU40pmDGya2YkiujRplNxTld7CKoEPc7aLoP3LiAjOfkbzSelxOPdtBPnv37JFTXtQNDCX0KLSByNBpIQFPwsSYqm8ANSK+rIO1vOjEok4sKQGf8Stw77njcKq7ABcW5+FCuYJq8wos4cQtsSMqR4kI7CGtKDTBlS5bvLge3BJ6+2iX1BYygUpVFPWZO9sl3ThYEZwx4BqJKKyaaCxY/ZKcs0POGJaUHXSqkdMs1/TDij3WW5B4X7dpL7x+1wGgCCVXj0zFlA3fm7MCgn0jVTjjkkCntljok3zje4ixnTqJCIdMthhxgYDFw0uF3ZEJomnRRbt9OAHbPMhX2fOqp3pDqR7olvIOFT1uOKJJ1ngl3n0vcVZRJrAftBzSF6z6s2rOcXDJgsu8hZR0z60kngwJgzO4EfGVVIyh8mp2FGq6lGGztpG8xY4tdjyWXQaxefpt0+1M7UzuhwoLekvB85Uxg+dlnMicq1xgn6nVngV/w/BDoCFqLvkASAiUlFrKap+8L7Foh7bCyVMo0Y6cnGVcooITRMDkFxJpHlrw6MTK1cCHJItIrzuXSKz1HKvr1UFZCrfJhMyjO/9zx5+EEy2Zfo6XcdTGcYlUdlVQnm6VKZhAtnBxdO+IrupJNgWHUvVKx6lsHEBSp4EszXJ6j1QVzCtDRtbd+V6OG8v0Crvh3QBpGSOiEmLdONpa+90E3LXvOrhhdCNMQAZxyQ0MVWOdintThwOsoanhJLCMundDnZZ+e5sgD0G19sO7EKQ6oWaPUwsdM8FMn68ys2cb/ehrykt03if540QfOE8jdJ20gkyQn4YlME2G5dPkQB8GFZasQrzPO4nxU3ioleuKNYqaEJNg21cWtpCmYMX1LZ4eD1Oje4wXOac6sk3FOQLmEfBh7a8QE2+566JLa9hBBMul59ifkInnPdMsNa9RhTXaCLAAmyNI5sCnxMtHkeuesZxkkBrYptLVXrb+l9fFT+OUA0gtuq1jk7ATVaGj3fPAQFb1jvOoMsm+IudIi0NAaKDxggSpiF95SfEUf2QVg/G1F5b6U4vwaUKBjNRzSEMIRwubgxXro189RG5aF1qxY4eemkbN4eaxGXjznuvhytFpKGl/21xsymwtWDlX61ntW5/IjG3UZiFFbrDkFy2Ep8+tyuFVVlIclZkVuBpiVVA11tg2e2BHJqERkqiZB1vMSDnm5OktlChLVwWtRJxBKklryKqYpxpKkMYAsqAG9R1OfeSa4yXPKPWbo/yZSM4eJWnAiNZu9mEvK+555gM+i58gFw0oGR+/C5wyWB80T0igverhIoGxyp2LtBSFT7Pma1lygw6FRwp+r3Pu+t1+RcmEW+mOahzYiZ3tkyQuqGBu4IvtAV9HX9e8p35hElnzrVt2w0PHLsBCDsrNdYp9LBLOXJLCKH4kAIK80FREloin8HFBv7xNptkHZpSHPoqzVqSPSEFFP4+qMkpZSpXkdD9v285IHu8UYuarNu2BN+28Cjah9KeJWiEC96oe9Q9afiWI4IODKIXEKpwd+uHtISJ9REFJYuDrifCuw97OiGlCI+t2l9Am7MqC9rKFNnbBY83VSeACQvcTtdfdNUpefggas8zYQ3z+LDqIULWd2LRBklQqCGtsFZUkMyD4LYw5RWcZxcS7pEJjH3lLTzIbUFVeXOnASIu4RM4lYWkRAm0WTjkNoO9g6evMDKhq88ymEsXB5y+i32CBq5ZumNrMa4JFo3aJMSVOPRNsww+ZEfIDLGG7S9juzMat0EG/QoEmX3tyHOLEu1VmGyCgsbPa0A4sRTg9CspWYQnmct0cOtOcXZ9kREFt/t1qL9bva42TJxRUjcLfuzdshq3H2tCtOhya6KijjWyljGtWC8E5L/WfLJeWMnKMu/cs3OEFUQQhMlWT9HeC8Pw8gJoOMkQOg3gJqUgILWdOP4ISfzNKm9fu3gevm9oFG31LkhE8xPX0bk0eLdBxfdTVBE9QUkJqXY3YAWKIlUwBQkqxsCoXb2+wkGYvVMo5eObgc7zB2fjEJG/gTYsq9u69Eg4dPAgHDuznvYzqOcF1/YFUwxYkmwNQUs7SEvzZn38Yxien4cYbb0BCLnjrGWrnjttv5zRUF0ZrAzepFyu8ED330AlxfnYWvvKVr8KxY0d5R0vaVZG2t7nyyivh/vvuhZ07dvDexbxgReO+IRGG+9iqw8JLwszTTz4Nn/7Mp2HTzGaYmJqCG2+4gYtVkKp+9dVXSV+kgXXMrcackHn9xV98lDexpy1ylxYW4QUHDsB1N1zfB7/6oeaPc2HeLSpoIi0SuCB6IbnN8USk0oY1tR7MXPOIiCuartdhl7AtR2/u1BY4Mn9clGH0KLfKQhaHgyxWEIHgBqCiC+EZVp2Uq4tPOQuaSxKtUflumTByruAUQs9OK1CpTqlWZHvvzabg7ftvgBvb6J2lkiuZ1wJmwPeLQ8ivxaLXf9TaiuSYMp80uJAKR7+WllY7qNzpCjz80MO8neskEgVt7P3QAw/Bpk0b4cyZ00zAUeYOa0X+tbyBCQy17d9/AEawTdovmBo4cfIkXLlnD9x8800wlo1pnfCoivhk7MFTX4jjcHJykveHJofUl7/0Jd43mjaFf/yxx1HKbeByQ3RkmRXtj+afrTBrlkAiAr/22mvg8cefwPYn4Oz5C/CZz36W90HesmUz72VtPov1HGa90fsWlxbgik274eCTT8LOnTvh4vzc6oI3gWJoq/+0QivSauGCXi13SdzXPz/0up6DX5TDOLqjb9m8A74+dxwWdJlfSZNR5YGv9I3f+TDS6ByKKlkJkQGFf7X4wCAcN7XU8nbJGVN0xgBOj8Km9hS88MZNMFYK8fbQFuN8EaoHXjlYZYdiWJv7Dbin5sl2jbukp5F8DUDpyiRY87WsZuIze/fshh/7sX/AyTzLKDmPHDkCu3fv5t+0TC/ykbWR2eQwScCbbr6ZdyOkPzomJsbRB4ixUgrvZKAZaDoiU/296Ei+V6k66zg85NsteOMbXs9Sl7aY3bR5MzyFxEH9PPTMId7aNDOhY45Y/Z5+RvAKC2+PjsErXvFylJYtztrqdTvw3OHnYN+V+8ASbNZ72K2Etnfd9RrUCnbyZvS0OR73zcUCD0PUpNhWIlgMLoYSEK7huWMnz3uOodLyuIoSOCiZw8PO7dMYRsrArSHu132YNZ90i1b5UN1drnaJHTxT9OA3HrsXnuzNQrfoooqK7+cF/MAhqDSlT5rzWotZgFKTzl53ZPLRGeFqEjwmj3BRmMyyjxyr6Tl6ZduLU1AeHYfOIQe3bJ2Gn/m+XUBmFyctACV7SUsLvWWYHh8FK2L2rTK/wGzMFCArCJnE8dPzsNyhipy0kFtSK2lnCZq7HnnHEQE7Kw42bGjD5plxiMUGmm0biCIbS9edOtd/f3Od8/DORybiG1oE571r4b4YD9fFIF4WI9iiEDqsDhs1SJUjeaseD1wYPbSv76iVJnJO006hFpqrw8G4uCWUZAkGSV/yfPWwUf/QG5oESAw7z6JvYj0Mge7soEA7dmKWB9AqJBZPC3eCQ1ZvVcGhMtgNkkzDCDUR940Eaz2p24fGe13CebwaeZIPLfHBpYtI1M8W0No+ASvFPFd4ADXh+wSUSlxnXQRLZ4TEGwuBeI1/pPFV0UR86C+r3GTzVG0YnZuBlYMjUJ0Yg1anQBWowjg5p0FLGEpzbjs5MBPyLqpq3xIBJwawT41qBzVmKrfFlS6QjDPMosI54fm1vq2n1lN8fezLqmNMGJhreHBZb0gQuRbr9RId0ACA2MjOhX2HGYFbsh8v7VVEW32aXW61yumQbT6z2nv7D5+Mx9Vj7jbW/NJnMUj78BaNMctFuLTDgF2B8anYTsTuwrl0ehsT3Hdm8OEDJ/OB8/FkWeAdBMNt7ahTO8Xil+TvW0HK+cLXz8KRg23IptHLPEqZTyV7mMH1VGGMBGIti8oUBXxMlYegUtFhKf+Z5h4bAYuzS56hgmtZZxSKC5tg6ak2uLPj0OqN8X1Ly0uwvIhe6EkJWdBzJI1lyZgSR2BM38IRZt8lDNUFaZFAXey6hFjt8dRJ5hrNfsv9AohM85Jx0kfeMkj6e9WjtD42e6BpxZCTDfOsLjZvaq47M6YqstBzlvTTrT2YdV+59OP5aMuBhfh84uexg3MhYsyrafkGVW7Vrohq9TR6LGmLTdov6FWvehXcd8+9cOzkCbQlrmRP3De+cS+Mj7fg9d/2BnSUTAXkYi8jEs6Txzrw5QeWMZyxGYrzc1BMk1+zyzlVtPDA+bwxMOmgqcOmEQUbCBrahJMgkqQvmIrqQj9YUUU1NV8eh7knMpg4N4VSFiWwH0X1njLUFmDxYg+KsRGp4eWkVGnKWAA8ZM8XCojm3AC9jTD97Woax6Uea8/ukOvuEtvycQ1SWHRRu5YIETE+YyplVfJufVISR4jYiv550MJzDvq1iOdlKi6HU30LbZlJAKaVGHa6PuHKQsfUCLEVB7xgzXc6BvB9D9zP3szf//3fZxf/n/zJn8Bb3vIW3vjrT/70T9GVvgw33XQtVLS9XsIa6FhGwrn7K6fg4vIU23YrZ0sY34l23UihEnUAWZj9mtgdLhCpXnfQh9gWvqpCamMI2UNJlRryUqppoe1N3ypW37tsY57HeF4XveWFEwTkpWgAGnJa77EehPBxAOnZVJUCszGHDLTWFo984NWmUr52C2YGefCuH6lqbSUfdj0lXkPCKiFuy5ziTeCdLETgYvaU3oghM/ZcB6mrFVQSj7OcX4tI4BJo8m+xLb4lip74Tf/13qKhAaaFyBDdnbzSUqlpO4kTYlgnCMjvePs74PTp0/DlL38ZnSgbeMXQvffey+5/av+ZZw5iE10k6rdKHqziHtVQuuepBXj0WSLstuxqeBGfme9AtWlZOl2J2poOinNUE+LNkl7aWcnoMgT3AUBG7CFpIG2z1QU/jc6gcyUSMZeXZwdbF8d4eqGj6zwTd1kmxdHYNFjXRLp1McWmVGL22pg8Bw7SulsS6Jfa2lXla5PfpHAzjwKswJRyiF7/IYHteF/VaMvgGaPtTv0DoMxHJIvmcet2NJwNxhVOtCigpk6yPUvpklaIPZf1vZWVfjVJVaX4ClrNP2aXxTG62hgjo09HbyOKan0fI4XE2RXaciE2H+4LYdlBsE9hll6TDRakZJyL5p7PwnjTFgrrhOCBVnfgH1Kwu++1giexCZ2UEyeOwz//5z8L3/Zt38Y72e/atQtmMfj+3n/3Xvg3/+bfwZve9DZ477/5t/DoY4/A7S9+MafPd/C/E8sj8NEvHIduuYXXiFLyqF9sQe8MenVnCuz3IliSm7xP1SqIqnLg4Do2mxyfqNJ1XlSfrKALoE7s0fudb6qgd2QJirLgNcdZSZU4RmDuojIKn+gEJgQvhROvg6kbY6lqjxhpuDAPPKhQXlok0cLCImo6y2CEWWvYiMkNeqMSoN5XBWbj+u81PFhl3ClqsqOzis9kWvvLVCma1koraFBhP9pQuzXS0titeYj1nsYOjYYHzkXNAGpwG9y55tBSHNJOB4YfW6uPv3lYCaWYitn3WjlVe0/87rTGF2Vzka1PtdEj80nZufwuYtdibjBAk2ckL2kwZV4EgED92F9/HIP+Z+Duu+/mvVUffeQRmJufh3e88x3w4b/4M3iMAu5bNsKBq/dLkXaWFi340r2n4OQFWotK5Wkk/ku56tWJAkZ3T0BnfAFV20yLoNX1ACNQiz1WwuLB8NpUZL4r2ZjMJLaUthWg8Tmya/0yjE53YGkUQ2orLZC1KBVvOblpPJaeBZOIBg+Xcubn4/A18vP2jzc0kj7Yv071U68e2F6VxhwDxPR/iZVH/cMad7X7wpt8Sq1pF827P1jScDOZSnItOMDhvUqKv9OiA94onuPBRNCFFDqgjdgRp6jAP4dyMp013TWEJVMmUsmrSeTSPvtUHNvYsgZUE4GU3CmEaSpIHEpQ4jSsJ+hlEt7emRC4MyabmKY1huDr4DSB73WhBkdxbC1UMoU6FgN5YaRbNSawDw2H4SXZnXkLvvf7vhe+693vZoKhQH1Hi+WNY/B+uTcP5XIJ7dYotCfQq+uluDYR5f4dY3Db1RUcPHwGZjsTSEDoOKK0t+UVqGZzaI3lvBbWayH0QHhpl5SIcoihiqBW2cXEeMwD544D41tyXcXUXoF8I9q9c9LHLFuB7TMduPWmnXq35lx744dQx4Jv8XCNz9C0a36JKlgI1wUenIHvI6qUIQgieqg1DE32HFoYmITvAkOQI4MmEXvThrzWLFPfQ8lZu6IxSNmbLqcwkuR1tJ0rp/b6IHEFbV2I8UqfYt6+r0GqORnpOiIHg0bia8Tkhl/3EFa2Bbj5fvhV3ugtqr2+MRf9/bDAYBXw2LRivuohujv0dUGFBnvAnDuw/oPuXeRyPCDqG0jAntQkKhDAZUqp+n3ZE/BmlTKjDG47MA03XTUNzxzvwtceuQgPPDULZxfQgYT2+NLZEcg2Y1iJis9R6mKWvrE+UcZ2JJQgIat0Da5MPMRJ995MpdBm5WWBfJUvQ3tLDy4eX4CxHkoFPwevvGMjTI+pVEshaJzTNSHiBnxf3z3G6G11YhggQCjJAuF0ahf5huBIvnkLqyVEqf9Y7W/nsjpXVC8va+leZX4QRWnigz7hGoQAsc82nshLPYeJMg0Z2WIaUEEvGpHUSQOuDgM6tyKlZGneIEwdSJ6SD5/2yUEtJu1TH4kWnuD2hc9BXCfia2PIMmNQKUbGngV+OyhXYkA/7Q3BsGtEGHwD70OtUB8mBWBdoiRxDhHAz587B48//jhL3rHRMV72RcXxxicmWJXmvYhGHNzx4jt4e1DvWrJjHMgO6NfvHoEDOzfDm16yCR56ahG+9PBZePrsInKGEehuWOFZDYsUIAbcI+q6oGLYVpC2HtRUaICGNKuN0wFoZcJejhJ4Gm3IUbS/58bhBXtH4Y6rpyCuoPDxe0JY/QkBzXekPWi8u3EE5EkfS841/K6xXZ/ImaDaKgzMC8bERNVXFiW+ih1fXFzm4vqkPRExLaLHXfYUynA+R9EL3IOFxSVOi6QkCkLyleVlGKGC/Il5YkwkjNS0FHY6CWXmTmpxV8o0Or1lkcSVlKelnUCWlpaw7Ra0R0aY+ZPUpTRH4jG9lQ77SkjFHBsdT7jGAIAprHyTj5rjkRg24sgyxvml6EXGMWa6Qpud8eZymdbxxve3R9vQ7azAEo6dFn5QEi1VAKH+Eq5zVVGL4QsAtBMumRM9pbkR9XnP2AzyYQSmKUkAVGCYhTkv6uOuD3rVw8VZokav3LsHtm7ZnKSwOV2XSZUXxRin91IVTFdJiKCiouvcVM6x1nG0d0anHGy5CQnm+r3w2MmN8Nm5g/A4Xlu2QnF+SOokRO4ndBy5K5/1NQqDdITWkqzpIA8nBh1HVqC1sYM0nMFrX7IdZkZzRLSS1e/MpHgqrQBq/RkOvXUwR+5+/b6BKOqSGfONdwSJIIzZ7jEQUP7wL/3798LLXv5yOHz4MBw9fBQ2zMzAz6IjknKP3/++X4IjRw4z/P7Vv/pX8B9+6T/A/Nw8vP71r4e3vu1tcM83vg6f/8IX4D0/9TNRejY62GRRpmpTvwmOhPhHn3kO/v1/+HewecsW+Pa3vg1uueUW+MQnPgEf+au/ZEbx9//BP8Dw403wpS9+AZ544gm4Ab+/D/uyaWYT7+jxa7/+6zA6OhY5GzP5KAeNYaW7VZhkk7LJtDPIMrz/l34JGdIibNy4CR5++EHu24tuuw3H91OcdfeNr30Vvv7Nb8Df//s/Cu9//y/DsePHYdu2bfD//of/EH79P/46w+/a666DH//J96hEz2DQDhmulhpX91MY0YbQpk8yw0LsI5I2fdSKLlyOA0Zw2XGQfcOGaZianoKpqSlOOudEdlrhMjkNYyP4vdUOW1zQY7lu/mRcZ7nqwQpKBlrvuWnMwe37x+AN1+yFaT8SVpJQV6OzKmU4zY456AuBeXPIJH/haa5PwaERLp0zgsS7eQ6uvxrgmt1tLmky1pK+ctkh79dBrM/z4aFh7qQMvUk5BB2rmaVaixOJSnA5sP8AfNsb3gAL83Pw977/++F/+5f/Eo4eOcarZlrtNvzEe94D09OT8IpXvhy+8uUvwrmzZ+G1d70GCexmDBeehD/90/8KL7z5hSiNOrJzR5DwWXBaSV1up8vjtB8uQo0Q/cy5s9zfV7/61bB//z4e1xe/8EV41atfhX28Ev70T/4YDh16Gv7qox+Bq66+GrYhof/Ej/8EvP7bXg/XXPMClpKG8BZqg+DWsj9IvgssSCOr1GNNq7C+/wf+HiyiFH3R7bfCP//ZfwFbt21Fh+vVfOtRJNYPf/jDvNRwdvYir4D60R/+YXjs0Ufhk5+8G06dPAX/xy/8AhL+I3D82PFEO3I6Rwk8nIswqfUxC/2u6W4uJe+6iNVhKDC9GMu2SsPDeo/IeZu5td5YvpPF1BkF4qEMXaFlx1RxkDj4So9IY4SLpedcTqeHPuoW7B3bANtJNal0i5csC/IuJrBbQVfbTsNHw6Sq1JbzQQ1RNh28orSmmPfHVVWTksYpqWN8ywK85jWbYGpUMq+oyn6L9pJtyQbo3Z7XipKBrML4/foBOBCiLol7BzRMzAdxokkNsGDrJ9y8Rs+KCSaR2B5GIBODJe1nx/Yd8Id/+EF4wxteB9tRqnAdJiSMO26/AyXP1+Dppw9CZ2UJ1cQF+LVf/VX4D7/4i9BF6fehD34APviBP9RqLk3tzfUNKizry/LgZb3iiivgLW96M9x/7z3w4T/9U37qB3/wB+AIagVHjhyFJVTb3/veX+Sc6N/73d+Fr6EkvPPOO+Gb37wH3v7Od1KxMqiz0v739usCBiaVf4gLbYIFksDLX/FyFiALSyvw2te9Dud4Bd77i/+Wt5f5zd/8LfiL//YX8Ja3vBk++tGPwuLCAlw4fwGmJiaZsWzcuBFhtCy+BPPegdXKdkNmmo76ogmzRhJZK331LoGtXMmEExj1x5deSlJvTEyPKW3mLZTMJ0vEoA0leTWA1PrFl3WonpHjGnXQymRvWrENcjY1Z3wB12/YDqNdkZ6ZZqPUVtrQ0j/9A0Vsqcbh1faQNmVstkBCCNbsC7qnECbJdaLoXXkLbZ3xDl8vKl8bL1dqpI4w7saC6tExAus/GsSe8N+oPOiYM2Y8SoyuCskW8m7ZtNSkjhjmyrBcFf6chjaIiKmIw/t++X2sovZQmt79iY/Df/6934Pf/r9/g+P4hJA33HATTKJWtdLtsp38pje9BV71mtdCt6KSvrLVSWV1kFzyJ/oSM1an9ptzksihigA89vhjcPjIEViiTfWISH7rt7g++RV7dvO+Wd/2xjfCd7/7u+FVL38lN0drdR9+5GE2xa6++gUAJtVdfYz9f9YvKc7stW9ccZKLRmRcGI+svk9/+pPwxje+GaXpCfjAB/4zhkK/A+567Wv5NRs3buDkpG3I9Pbu28daDGktv/Krv4I+gjnYuWunzIV53IyUsmpIH73gZDJXLsASAj16s3sbXk134swFTznAVI2fVEiqSELLCXft2AATo/klIOLwKKhq6PG397ylKOU5rdCerHiO9kgiaSxLB5GwnZYxwXMHYQl+65GvwHH0RufYzx5tqdGT5O6VzGkBkRYXEgNa/kBbhnIKUMYquq+kjErF+2us8GRVtBCLC8N3dZlWwQv6KTadlbTZGiVwdOHlm/fD9+26DqarnlSk9LIEjg7ekgYZUGtE6mfTdpay7MtBWlnx8g5fiztSdtXJUwvo7Zfi9FSVMuflhIUstQPKF86B1rXnRYUS1IHViIy2E0CqMZFaPD83x1Jkbn6W+7xr1272WVDK63PPPgs33HgD7Nm7mxe9P/PMMyj9Xsz57tS3Z599DrZs3Qrj4xPcJHtkQ/wEGhMvP0xQV8oQFxfm4J5vfh0dVm249Zbb4KmDT8GWzVvggQcehL1X7uUF9+QMpeeeefYZrrxx4cIsL+DfhdLbqKRu4zbH6/uRUHoszJeECUr4Z1BV33/VlfDEk0/Cnj37eQnnkcMIgxuu4zaffPIx2LVzB6r0zzJx3/qiWznPn5KYHn7oQbj5llth69YdwYHF1OCqIf0aMutaUY+UmpVOxfsd8/JR1T6zrEzn0bsTpy945txEGF4ImHJPd+2YRgIu6mbkZeKjj70DW/cphchkQzFa57mEiOkLx84uIieqr9DSfl5ErvlHzz0En104DjnVG8ql4h/90R6sNHd5KYXUojVk9gcRUqnyllrucP0jKgIjGT11lTNU0qfF/AjEq9w4/MgNd8DWTBLHXSlbzqx0lnnrjjHNFjKPN6u1ed5X/eGyoOZB7cZIwAsIp4K1Fc9e0wy9+bR/MBFxp8yZ+RY44SkB9zft4niN0VSlJruo2HCa7OEtZbEysysRDmJTewu6kzMrGzSO5H00O+r0qnQHwdpSECeahHi2k9CSGnbOm3RyIRTptbqo9arPXzkYumBbqYCX8ckKKFUNdN1t0N5Uu5BUUAcxC0w0sBAB1w3EDUaD4+fDe+W97HCJ8g3NlooTWYiAW7qXtKOdSEBVRWfkbkdt0INsiW/hMMcTSY1Cd1gHiaO1UHeemhzhLBxy0XdLtcW9OBomEag3b9oFox409CS73ZFilms4pyxWoGwto2e7p6XsKq4KWLSBqyRSjNdXsnUMFUZ3BYYieF+lUvY2crRPjm7SRVt05Ug0+HeuexFOLs4CLZ0ue1Khgrj/xHgbxkdHWOoaVosUzpVR1e3CS4dXn2Zda67ppfBm3NaOIZPmTBpqUgTjsJlRIMQBiuSZqePsduRn6k4XfY96daHP9HJ1avJC5JzjrtqK6NN5iOHbDo3k8PTaz0qZmTl/IHgHUsli5ovrG7tPfzNxGepb6DQD23jezEDZUExKDHPxPnt3YjKKapuD7LskxQqCZzmJ1EDS56GHHxzF6JehLsxhYYOWxQyQAAGev4M5abNRHz4rzQKfGEHnBhLAEnp5l9Eeo0R22hWBytbsn5yBK9wYHAIkQnIeZVTLWOzXHhcML1gig04CiWNSvXgXBVQ7aPNyX2aS6VNp8XKqxMg20Yo+3+MUvy5xQckBhHlkKk+fPwvXtWcgR5ofHaMC4k53BgyBEUUIlRI6Ton/r0d1GXBPFA4DD+HuKfN1gSnWEjtWe6fPgsaiCh80PfeWBBPiqC5LJLvCILwqUZ/D+9N+uNC8y6ogyRy4Ohi8lKENe005ywDP9P44ZPniG5DxA+Dl67ckYxApqhVK0Yy0CpSZStfcmTaUax+yQJMuIU5nvobQuSp534C5CI00YZcOxccZ9VZlpgrvK8T5AQPyMi8D6YYcg2zBkHiujMp8qDRxo2NITCiFu0tdViVoy1NyZt22YRccP3sQVnKpCdzLzK/sJSRFm31zoXGRRjnvJpixp5XCXFS7igqAs51dosOCFu8zSLpMwERuLbSRJ1poFyPbHeVq/QDHL16AxV3LsH1yjCssBNSsSUQDZDLGdUNp8B1+2L3OiMvHu/xqbUY1Nu2PMFVT9ypltBqNAEgYQaZEmsURNYmmL09afSKDEn71GXZogUhtWaGk/TEm6OWemAXmkyb8YNgMOxJ1eRBBeWd7QPFW5fyb9oPg7WMxjCnhzp7Csr7DiGvMcj2Lva8j8V7Xz2xsbbdX8y9UVwWvQ+AkZJ1Sb6mUSUMO1kmX6yPevk7XmlAwBPUIpAA3EXFGhDyCceEKlrrimr918044sXyRl/bxJtkgCQFtzbOV9cAt8XpTEQAMRWVuFNXyCXjyiTNw9NwYL9PqtDNO1qhWaC+djDdzE+67CHe9/ADceKAtqhCl+qEE3pK1YQvauoV6nJ3LE86bIrRKMlVLAYa59dYLKjcAdD4wilRWRjRIzoZnXWqGJi3FpHyyaiirqk02fS79Jyfd8soKh1DE2pI3RamdwqDRtlvbYQP6bm5FFQhKIqFMPdruh5x0nAHFPpJlXuAALlvFxl3lfcHXMazfXnwAyLhJ4o4hjhTtEdn4D6mY9ohaRFwheJReKzU7JVSfSFtIZyBNvBikHDeJt3GJtUT1G3FdtEy9/VXQigpDMBPKMX7lLw311hQ18YYG77Y3x8UKGnLwlJmVkfQchRWcvM3dFvydfbfyOamKobDzwpkYWJU4SWgLFAqR0C51WTYKr9m0HT5332G498ES5jqbubIkgNSB5nAxEvx120bgtVdsgQlaKYPtjJG6nEn1SSkQn8MZ9Dg+iV5KwqB9+/fDzMYZeOjhh3iN6guueQHGTJ+GZYwh7tmzB/bt23fp3uj01oE6tA8akndx0qMi6ge25Rrw9ibV8L8xtOenJsY0DVDhQn1GYh4fQ9h3ehgqWUBYVgOcVHUV2b7XhFyqIZsktEuqJpIvYWp8nGGeZ0kBB9S8MAyP/WjDPMaEF5dWIBSg60MkB1ELMqdX8r6EoTWJh5g+aabtEYTHRBuWUOoePLkIp88vcztbt7Rg/5Yx2Ej9WFjkEBcTKOUQuGogtbjQl2SRR2pVuAFEk5wSCRylMtdI9xDyxymLrDD5a5UpPVRRRWvCR1pNID/ohmZHfN8NfUN1BkRp1z4N1mTbjrYoToeAXe5waVIuepZrzqhT76QWmpNNngvJYc0lU2cCQz1ve9kBuHXvMnzmgYvw4DPI2Vfa6nVGrl/Nwitu3MrbYBKDGGMPvCIjayyiRp7B0MvnPv95+NjHPw4//dM/DefOn4NHHn4E9lAZVlTT/+X/9i85q+iuu14Le/fuQWQcXnB22GGgc4nkDGucU6lfU9ss+T1tSJC3hjPhbsk7HkfinUQHIlt/CLdjZ0s4N7cE40UGu7aOI+GU6GlHWE9OwezFRVkdlJecjlPoYosYMpFZrNQrqwXHoUbUNhAXmUiBWDk1NcmSVzZ6EcaVynsKo2yYHGfknV9YVo2tAtuXqabyq88lsLTkujNHk0uJXYhkFE21CTSTHj3VgQ/+5RF4+OkluLCAzBzpYuOEhxuvHoV3v34T3Lx/AhbnkZlQyV02yHr6Ziuw32QRLo5ZF0W7BiOpTZuqzAxSdujJIiCq50YUzHuZqWQOKrQBjY4qBXqNEL32JUWxIdLF9X1Zh5Qe8Iz+5MQKHPUEen6pfOoylYhEZKLq90Gt9LZqxjHxUqIFbfhM/LwsOzCCE3Hd7jbs3L4VXvj0Mnzycyfg6Qtk2YzA1bt7cANOzPS41600Ex6VIMP1N9wAR44e5fpfVLTgt3/7t2E/SuKLGE8lDzXl554+fSbsDFD5KuZODzsaOmFdV3EN7l5Di/DNqWT2aYJ0ks1Vv98z08vbOUpedNPjjJ+Yr+DP7j4Dn71vDk7PoSqbd+H6fePwd9+8HV6yf5QZaBcJ/eL8ItAWqxXtILm4IvWUtQwO5RRTGJDUX0r40FQ3ZYSqLrkKzMudKRFNjo/BuJZPqoINLGo7q+5ZGVB9AjUFyiFYWpFN3ruoHfR4FWgvjHEZ+0GIT7tBrKAztFWgOk5/qGHQ9iv9qOm5lNLY1Bg8dLSEX/ydZ+DQqSkMOM5Aj7b2xPEuzVVw6p4OPHnoOfgnP3Y1vGj3BKzMnZPEGRz/7IU5jt3OzV2E6elpZjSLKKkndIEDFUUUz7uDzVu2hqmMarbAIiXnnENHOTM4SvnzlWzAFiqRUL//yT/75z8Hxt2pNjRtX4jUPT09igBw9QhA4PpZgjjxap2jNEk7RdIolfto2tcBawhs7IIlsnO8fw9dpzpcrILp7nXG7ETNQKTqLiFgu4zMlKhCFycwWrRvcwtt3Y2opnewjZPwjlfvgwPbW7yKSrtW4+IGI8pOoglZWJiHr371q3Dy5Cl45zvfCU899RSvovmu7/ouTkP84If+EN76lrcgwrT7VWibLxvqICefXkxcZjC30MFYL2ofGTBz4gxkb1JQ1kuXXGebtgxKbNABpTOIqKanW9jXAi52c/iV/3oU/uwzy3BicQMSwAZYqAp45mQLHnrsGFx31Qxs24gaUFuIg2LSVPz94MGnUGq24WE0Ic5fuMCJIVTUYX5+HjZv3qLwS8bnVJMBE8QZx9Knp3QrVBoTzuUy2nqHT1Rw8HiH0xpJAyC71Kv9W+AAF5e7POePP/YYPPPcYTh69DDOxQlmpFT4/fSpU3D4yGHezoV2cDh37izPz6aZmQTIGobCRsdHR2G+GoX3/+FT8MDhGYxEjAQcpY1keY9MNKHOdVpw/NQJuOu2LSixO7BEG3jj+fnZeXjiqYP4votwYfYCJ5tQnPskvpsY1blz5xE2Z9l/Yn0QIeETDquT6USLpC2KC95t0elad8kaI2ZE18lsKwyfjPhqtMOfqt+7ZtUpD8HNH2siBIQfgJIDvw9Tp/vbUoryllDgOSe5VYyxg4OWthWttgLGaWjAcw4tSVTeIjJrQZccEhVlWVWwAZ1k73r1Vnj9SzfB5japabqDq2Ger/eHjq9+9SvwoT/8EMaCO0is74aXvvSlXIWEnC2TE5Mskel9tLJGiBdgGCiGKSPehgvJ3PhB90WYePPamjYSOt5PvPS9hUxoLBthx8h9j8zD3V9HGMImZuKFx3h3OcIZbkfObIA//NhTcNX/ch1sRKk2gWrm3EoJu3ZcCVs278Dnu5ydRW8gCTyCQXauGEkSg5x9WRyFjiSotHR+BBkx7TcWgjoYSfjIl87CB/7bMTiz7GH/dgf/+AeugVv2tsOCfkpUIeHSRQy/+tr9sLwspXiImXCCiOWGk4qpm2mz8pxJkkUsCCFwpT62kIDvfXwFHjnkuUqqd7LxG1eC4X0Wpahe5dvwyNPIOJ5dhtuvnoRiuWKteWbzZrhlwxTnKEg9a9TrEB8zLcLHQTFvO1Gk4i0ReqY6izRlzaZXyo6MrBXSAgzEXdDSyKThFbEJnyjONt+mvmU1eyF1owdMMxUOFKeCqZzIaPM4Qj1eatdqiyHiFahJYWdKvzkoHE9cUdCazBW043Aiaf0qyKqnPBsJE1jQtqR4/0pnCVpob42N0vKJHqpvUokoeMWdq2u1Pvbjda97Hdx22218euOGjWyLv+71r8P35LwK6y1vfQtz+s04oUVRrOIx7T/6tJFhN8WJCB78WvWsNIGgLxPIqcaScwI6ab8PP3kK5ktEfhBvfM8tc8ZbQUgEbXj6uQWU/iixN5A0oG1R5uHwM8+xP4C8xrQogtZ8E9HmuSRkEOPcsWM7+gH2orrtIyH7ZBgAuvtBKYn6SDjnUX3/k785DkfmN8Oya8GjR2bho186DNfvuRrGQMIqTMS547DgsePH4Pz5i8jAuyD1owtJFuICeD246aabZVkr5zkI3toCGJ+KCfRVPHdiHpY6Y+xzqSpZ0EKFHjMKKdGewtUImmEYdCxH4fHDc3D7NVs4fEnazzNHn2HTauvm7bzscnFpkU2rPXv2SqFG8Lo2QObA7H8l2UAwQaPSK1IjLOO8BypBlOWVapi03W7flj7qInEJIrk6xxDmltWpND6phC4hBwGWdjKk5JkDISFoZ20nnDo1QO0d4brmCWvJCl6IQKoWOmRowMvLK4zPBUqDVjEiy8aI+2E4qo0e7fHxSUTSir2H9i4q46NaXBx2gvNGB7TQnUrlUojl4sWLrCaNofeUVqYs4bUel4Cp4Mzjj/PqFFptY+ui1zr6RxyhmzLLwLN9wnB9SttB/x5wCCMmDz5F0HqewnSCnEVFtckKzg8nxKR5rnLHCFT2xFFIVhjt97sN/QibN23kbCkyZ3pdsUEJycjRRaEoyWH2cYcOwyXn6gzex+0zO/h9doUsWsphRyejm4BzC+eRWClFld7eksUs7IXNYWZmGzLSrWHMZONSMXiTJMbwKbe7yHMwBA88zhsRe/RhIHFSxh3nxVcS0UCmX2XLQHnzHBTmVMdKTLMMQhLSniv2wbatu4Rp0zao5CHWvbfpBsIZer8U8/O1d9fUqyziOeFNi9XlDoc/iemSBM+yuHF5UePPPtqkZsmGWKFVhXSmPBM3LNn9HonbJic+Lel6LhUaENIAVapL/nv61gT3UskPxjPkHTZ+K+xNUrBCxBnBQXe6FUtCswRp0ifQWULhCtoDigYuUtfS4NYI9+ilU6dPs51Hajupi7Te+TT+JsSh3fdoa0vwUoycCJwWfa+XgMMYoUl7EX4uwK9ByeHDJdpR2qirSWOqs8xJaPjfFXsmYJRrX2cMp6os2N7jbCnowpYtbfQAC7yYhFGVnkcv7IUzp7hZQsqyJ6YNSb09u/fi/ZNQU52dJGs0EIEltcNYvWkqU1MeXnzDKPzNly8A0jGMtc7Ai2++AudUVu+wX5vVS5qvAk6dPMv78HZQfZ9AE4YYODFXYp40F889t8Q+nU2bN8EV6HT0CeoZM7NStts2UVG9HkpYWugiHuYyW+H7KY8+572oUSdBwO3dOsPyg1J2CU5njqONe/qs1H9DWFA1EQo1kT+EVGeq2EGOvQMHDiDTmVEFV2nFpxar6MJcwD634hFUjaSrpXgBbBktpfT2JXIk2rAig9m+VpAdvZHImc5e6DKnGkUP2aZpI1xVxlNJCvWUerpCHBo0F9Ymrkx2qjMu6Rv6VhWKRLlAyFr1BcyLzs6dLAtcvouT2GYvZMZu+G5FG0CXvPZYaCDTKJ2pNK7RWwcpSdEE0N65JSc/SAmeyEhjDrSVmaGSLPWjnzwHHX13GChc2kwimZNraRQh3Jxq1SA7AzKioXf5NbfthI999jF03iBM0HlDViNt2E17U21sn4U3vXIXTI5IhUSOf6JdNjbahmrDBEsoYmSU4EDzLiV38vAmn6oIprX5SNC0hJAWoWQyfRR6hp/6nqvgjv2L8OypObjh2qvgxdeOsxup63IJ1OADK1xfDT26SKjnLvY4DJXrlj0UzqO+jkxOsDlFjJx3RgQzwSBhdsD96HVW4KYD47Bv22F4/CSaYrxaje5HbaTXhh7Zz7xyrYQrN3t44dUbUCiXXK2D6rVNb5rionzkMW9xkQGp20XSmBgKl3bKKOd/MsBCVm5Z5pUJL2HAXKesAiZS57u8KqnXle1kyPfDdnurFVXomiSGVAIqUSplY1dguZPDX3/sSVhYmYSdWyr4jjfuYW8mlZJtY+B/fmFO4mrtMQXeBKu7pF4RAA8+/TQXfxeXvkOVdpyJk5Z0UT2iffv3cV2tWrExwUwwS932IievHjA3KhlIpLaw6z2XXeKZ8RAzKEX9k+wZAYDX3dp5vK5sjhz6lVrPSJKNNJZZ+pTUvWmK0Kce9bU/+EgsXP2ixJAw2WhMAIeEwEcB68KV2GIkdblKK7GoEOFMNg7b0ff3E9+3F371vx6Dxw9KPoBzK7Bz2sG3v24LvOnFM9BC6bOMWk2n51jdJsTNGdYjGB8WTYO8z4RkF1AanjhxkueQakhRCIX8FLT0MMaLPSM03d/B0Nv4yAir9TSGzaOIU6+aRIKdYN2o4Ey5nKMMhA+UzMGbnqFEpjprhMjTkxvQA30RFtDrPDE1we8mU4qkMPVtbHxMQelDH3xgJhmsLHVgx4ZReOcbt8Ov/+ExmPe7kLHgXKNTrcUrlCTvfrI4C9/5us3olQeYv7AcGMLi4hyvC+6qBmZOKNK+yJQgM2MObWOKmpBZFbbDSbK4vD4nTtiMw0akURQhg9XxUk+n28vQs4W9zPAtyAcfBKGIdDLWWRXusKeyszyOMTgq8LUUJO8DDz7Ehc8mN4yxytDtoKd3ahrd6udh964ruCTK17/+dVYviZM/dfAg2i8bgtrQwcFRUbUdO3bCWHtMySHRL6gvqvtz/rMWDGCXu5SyZ4bRasm6XOZaytFMumaQxnj1LH+sR811kFoDCVUkpJ5oEfUv6z7iExajV2MmULYYLrIEroIQLnISVsp8PYjXL/MFSZaXMYSGnlIK2b5wfwG/8I8OwMNPdODosS6MT1dw6/42XLl9nNXXju8ggSxIDjki1LmLFBY5Ce2RcZ7PublRdlbNYgiF/ACyLjrjkApJo/a27RDNpIT9YF8XFpeZCFve2Kkw+hHuNCJyrjYhfixj3HdxuSMITtvdXJxlom2PjKEz6zwv9D979hzjBrU5j74JKjYnBOwTxutrTJhiySXi5Jvu2AzdRYA/+vhpODVXsNeZtIy2X4DJsRX4vrdth+981Sb0d1zkDfk86ytdGS+v3W2FfZaNky+tII3AKIfM2MHqfQIH0VLkr1ImnEF0sJmG5UBy+nMWVD3dosgdP3XWUzVAtm5wcijZv0LV6oqdG2G8XYDET7XsDCMJ2gHLBdz9qSNIhC3U50t4yUt3IgBx8jD25XLU/XtLUrS7FC9pwRs1A3ee9k0ilYIQiCQwGfdSwBqgzapHybu7F608cYCBLGZ2Uggtc7IfE6jXka5TEgWr5iBqa8HGf8XtExc0tVrwPCG3S6ev/w7HILU6ZhxnvuL8pKOn5nnd9EhOYaCMbS9ZeiAmSLdXcOwwL7o4H43IQSq3yUbPBIFo9+UZVOvabbT3nGUq6W6OmfShwkbn5ylUVzLzZqRzpBZ2uSa4Z9koFnKiioAxivooff/ocXyjKKGmUQ0eKfLwvIV7QP0dy5rSSYkcYaFEqu2olJKtV8QJRAxd9hkGgAHvjn2TqMXkKPo1UIt88sQyfOnRWTh4TB7bv8PBy26Ygqt3IaNamYP5xRUq968VM0m3y2LlU18ljjpz4IoYlf2sxdaVe328r/Kh+KJDxtpZsQUMK1wnm5hT0fK69QrTkEcCPudLbYQIuGsEvGsjZ8c47ZyrnOYf99j5UaJqwSoPubKZbXaVW4iXLiCNeaVTSWo7NOkAbLBhgn1QlMN9uW7FYe73itXmnu5Y55QriSdU1OgsnLNnTXUyB8K3dAyiuee1LYOBeBFovo+eQk83FcjPJfySZ1V4tssxwxzHSyEWJeBUdQHfaJtaLlmzQvkCI6jqUhH9vCVvJWuzV62gjdqB5UU0nTq6dpj7WcYUSuejJzecg5RXhJh8ffE9hL7JtYrNnnHsR7vdFoar/SZ1eR6lNGW5Md5zNUl7j36xlVLB7JL12aFASN9qKYA0Pm5hVMLfMRQKEwiLrBhhbzg7z5CIXJecUagBdMkTr9jOpouEt0pX6VJEl5hBNnZQEvA1v0ClxS3CZuKVZyFF1WVoPtkTnUs1VLbx0ZThGLsSS2F6uIcBA+TPLCC7t4pLlF5Gf2xCS+A8V3XHsTSPyJOuWklDSM6Qs+FcCVtK+qjiWKpeHvbTEUcYcVoKdLecbPZMe+mkjCGUd4kCVz+fB8pzzyMFuzUuqYRRng0GPV784eoIM4gZ9J+iX7RUMpNiB8jNV6gAf7diJyD55XNikMTUec1wobZeyZEH2T8rF/9DsjLGBH4IEQGApVHGfZACJgehyX3E9ijtdW5hGeaXlnU9sNnrUkNNvUpqJxr+ZFrhw5iSvtvFfgRbMCXixITib2SWUNgMTy32VmD5IuUNKA4jQ6SKJV2S7BxWErvVaV4zayku4rS1LzCJ+BwmQ8fPqZC5xKwDSFgzzZFxqv2rEQyndAbq7RdB5GIiR5NHh3GDhIIMdpTYvYK/jy7OY4MtmEBv3VZKhifp3JUMHJekYDLZ+jJFMXZcUAIErRQizx1d6/R6PGm0xQYNiKQncWJ6jL4Tp6KF9HZkamNJ2MYybgIU+RlJPcsSBAIYHCpagxgHXr5M4r1EujcJBklRvait2D3RIeL6hK1TKZm8XL/nVlWYG5IaYmWv4FTJUgIkos7RA7wAP0YinC5rM0mWgtU1sSml6NqX+nmvRFZVTU+6C2MxsQDWZ5tbFxMjwv3ON15p/RKcTmmY9uUilliUVBMt45Bv19b1sPxo8c0ZCC5nHkw3ChqmC5PlA0OLggxqJqFlOHJ2mJelm/SlxbHqTNIlkZGRCehbpsU6TuRgSazDLGqAtA/11MiKCM+1kikPlbkUziGZ5H/z5JMwv+xgfzYKb37RdRSUgXvuvQ+5VhtDCgsYW9wlL+eAuOd8VLJ5d+zYAQfReTWO4QbyyNFihAMHrsJzT/P75i/OsQ1CBPqyl72MDX+r6k+qFB2ZhorI1iUbx7Pa0QNLoTSWFIjW5nCo5F2Doi6TVp+PtqIEtkddSoNQ36fH90mamhPQJ+cAWOVzFvsXLgHkpKS9icRUybVdK46Xg/NJSm2ax5u8os/OTYnbAwyoHlG7LyZa6jffbCBtC/qOZoQATFonDME1OB1XPIUKQtFiCiOxVCaYlLI3cVVECeslPFpl0i6ZIgKpEnzt5erDAYv5xjCr5etL3nNPtMaSPOsjTK8k5CgywwIskzwHriXHDycSGKApfX1Q29Jd3Thozyt8ABbQgTXfKWBJKwbSrRcunEdP3TQcO3EEZufOo9MDwwPo/SOJu7y8zCovrdSghPM5dLnTQxRCoPWz5L3mxdvosaOcWiJOIlhDwIr3he1wX8gtT1X7aTASKJe4q+zaDsHLbMTsaq7j9R91/LhE0fk8HcbUfaBDHxF6QHe8qYsAYPH9mPFDRxUazoKOmbHUCWVn+XK6FFClbsAHo4qyrw9rQsglWgU04dtsISVuU1B9Q011DQeVg0FMoYnhfb+9BGR66twjQoQMPcm+J4TN3uhKJbXMAVc8dQIrXmygUxNCRNyuVhsh00Q1RuOVBlqXdJMXpVCxRY1p2wZwzsX9gTPDayZgP4AbxrcLOGgFBCv5MoBxPHfL9ATMYbxuc0t2TaC/V7/yFVyK80X5zewlIw7Gi8RBNjtzmawW2r1nD6vHXNW/oFKostMB11qm1+hmW1mmmEuyoIiZYOwppzUi5N3OeEl+zZFiGpYzFdAlyA8DJrk22wmXHjjpbsj31duCge93q7frU0R3ysWb/Wm05xuqq4UsVPIFO1UpicwdjgGgR9lx+d2WIKHz4PpsRiFwLZ0Cw+EIfUNPCc+tdbP98qaB+KjmQxOyTYbmoaaR6AWXcsJwn2XlK3uiPXmdhOdyDuloDWlPtdUKsLJDRNxch5xTKzOmiR6VK2Z453G8HlSTERWY7Xp2sEro09TmnMNPhWiR4KGZRpxpiIq/u7p2WXBFPVcqkLhCc9DPzcvIt2byD32MYwfuuu4qdoKww8NJhykhIyCKcSkHycQJ0EY0O4lWovA72jJQzlZxoETvQsaWC9ULpZ2K4ruoBpTqYWZcrHQhtXPqcVYMsAmEQQiT/m4i4xDEXNc9a91XrfE+Y0aWyiooxkXtQZbVmYwVlVltMJ4HCfxTuVvi5rWsuEyyf8JuEsSYc1mtw6WFnCCxmVCZigc3gOS0RfBpnl3Kl/yQc4N4WUqEaVt9oMlX4Z9Z/ztgwO++d0OiEjgpZSz1OSDu/ZfJYguw7WGKJF5Lj+VaN6vOP6ugMsuKOMoPd17gTYtuyJ4mvw45qihq4HkJo8UHWrCwsCSLTiDuXy3zHJfzFnFynK4IccFTzETvs8aEiOuDhGMrQMHH+4J4h4T7GqBckI5BKBgAfZQwVSU5uVxBMn2F9kH2kHXqnVbrxuWBcFOEq2lQw/Bw+IWhcnLdx8CH1teKDDfJHw4SWaVZulBeb+CYKvoXNmwcA9tSpsYEvaSXCnOWxAM62SvL2DtlliINYuaSTYTyaIjhm/qofLwVho080PQQZaRJ54Pg2NdWYGjQgJf+HMSnG43VupI+zxeq2ttim17xU+BbeZ8IEsfpkMwcRlphyqgWOvtvyHFF9dZytWZVS1rqeDRJLQJklWeko5FuuCplVUN6iz4KMkAIA6TSrB8CbjCXc/23NU/EHNBY5pNXWljdHzxDcemyEmlScGUFSeoOAwavEjpC3DXftybNDJ7Z1KPqVrlvaFspB4Imtq5yaLwb1O7h/Y5pj2SNoxYawpMJNRiq5M4kAZ777qM2JFKd9ncSDabyMfSSphjya5XAHUQma44fI9BAgANGX/8y/J615unS2nL9bSXgbmimQ9sZeILbysS00BMhmSQIFx+EuSw8EIFkJXC4QJ2TfhZF3Lmz1xUHFse+vcZ4K9U2TBtyQos1d46zDb6NvJMJqio/wFfShIC/BGjoEz7lltaGfga892Glh3ntLBHAgGKI5yJ2idRwgxS+tL9hNmAoMwp20jCscetva+B9ax2RIG00lXdRgljYRClJNBdixBknRHAGnEpPs4E5+J9FZ0jBRNyRpylJwJXJ20wc5VDDfp8wMlfv62qHW/OuashTzXc46M9YGATjeGc04dzQfrnaO4bNqzJAnz7v4yPezJ2SQ0Nc6M6LnUt553QPb8Xj1XdDOdKFrOu1d5bsh8B2M8mAZA81v8jy7XyNAoOSb04eww0i3CV0MI2Nt6Co0aqHmgjvA3IEYH82bvwu4zUVxNfpWDskr4suhrywzdJkhYecdjw4wWfrkevvUgPkdSRtsDRojlHP+9rHOtsadq7ZVvMwtdkprDKuCNntlmwTpWGWzIiYb5esJErKqKoxKUgexEPFnnyqwMGppQDsOBG+SXZYqwE2r/sXqVSv9U+Zr4uOvuAUczVUSSEY7nNrMLX+M3VR6PrucwPvdbU58gMbN/4fy+AOaiu2UK9NLWfN8wwaenNat7lEyVqVkmYqBQ2k771OF4qRuI+WJaOEtkDy1EsvO5c4MMkbhYt1QeuNqO2oVE/u7osXF7hK4ORYEYcRHo6EmiKqqQc22qoGSiHduOQw3hMji77mBDCPm3mwpVxKpUkaCVj13fVDsakObYAmD3dWFwkSFcs37nNxpmst9rdlDKpJs/X3Q63SaX/PRZsQZ5N4LC9cWOA9qzJdwhibVltVJ5k0FFqFcwHj6RunxqU9JTZylvQ03igrwyw91TaPtjFIPjGfVdhm9i5XH39MroDagCodo4fUOKuRkuJEVrNTG80k9zWvur77YMgzQWAYg/HxntBiwCE3sC35Yr4He8Y+UzwRzzSY4OGU11xqbSsESGXudVAqt1zYalUW9IgvhzY1o4UjBD9ZHpuo7Q0NswgI4CX7hZGAypX0Mjh1ehY60+MwSnsAuTzaQJaI6RpqbE36KbEnUIyudQiIn2mRdt42opKF2qKOuBhCYbgIxbNqD4k7na+7SGM1yogEF3sWCSxu0u31PbUpHfy9hk2+Tq4+luWBQbzD+hftCIFR4qcyFiABflkPSpO5QrsSOsn7zlzcqlMWuJuHUlL6SFM5d2ERJbHnODzVVCIJS4sTql7BK8FarYq1Gqfz2elJLjubIFmWSFgXx5SlROn7icpFzPYGz5RwYvXxsAQSYBDJpO3FRIg6TGO+vU+qv/RL0URDAMOrJBMrnDXi1MkwfIW6JukSr1alC3xsvyiZyAqkgo/j/bhomD3qAucoOLX0Ct6adWkR55Qyo7QONu+T3V2BWZxvSiulOcudiztW8KfODfcV33rs9HnvVHzTiyj3tSxlcX6pjg7rOL8EfEC8YZkwdcDpYm2dWP6oZIUTlxixQmPSO36CVEWvxetkq07os8edbTBbA2q8J+W6RlF9nN4YiRseKFnrsHEF3Eq0kDp4mjKh2U6KKqwch3xwQg+qL822KsVtc0k75e20fEvmiipqcIgolzpKFYhnmaVtzpycTI+Oej6pC0XL1pXKW3lb0Uocgs4WE2i3Q6HAdOCuTsYJT6pJ2UFH7V7fbNtDLDwXTiU/DF6xjViWCRpagjJrgAFMp34PNIi1r19p/6CpMappWIkNnIViD8Igy1LWq1OWFacMV7L23TzVYeUVwz7nvZspPDtSOF4JLSuvMq6Fbjs0UtfEd+1izJeJTTeuJkPbclINgDlATc0NAPBpsj1A5JwJAJwMiPbpzTjfs8XETDWMpIaSJMebN9m27UxrKAVJFdTjLH5Xe9P6ajlkgbJSlAiIGScAIEqXYLsmX+sk6esTPqCt2k/nwpkAK5nhgDzxVlFds8xCObLZl+R/l4HVBcal9/MyEvqeCarmvOsExhpHBJk6VEs7k03ChfgcSxEuku+soL4PJZCE72nvagw0hUZ9HbVL4eJhVcYYmXH9NzR/A9SZr2u8p+8+Y4a+3mMHw6W9H9SWzaMKCqMFfZELzCKRMJnUt/ZlNCA5u4rpTwQWqdUV5zC0IM3RF+0H1NEIvCtIptqYE9c2mNZnoytcop6Yzu184g73fagapaEPww9qU6oz+5Ry9ZLUH6L3eFY1Ss6oclKGxcsSwVxrAYkq6ZI2PNQXJaToJPZBijTW7wZpQlA/fHqPTZK2BQni+uDzDi0Pa6v+9vT9CRIO4oCBAySSWCWwMDPPgX+T8HHMZYCrKmKc41wwwYt044AT1c3OszgyluaaNaRVRqkAAmRpXxUvQr9ds8c2svjh428H/ZLYKruAr7OCCH8X7/N1zPOQEhTEPHDfkJya7umsWFIwfOM7fHN+arjjk565pC3Zp9klbbD5AtERG0wqD5AkLnDGW65F7egi7+2cZ1pGKvofMjUVxT9rmZCQlI1KhYg5sUCIMXOW8wPgg73DPUgADf2zAinxOkizf2QcJsUtCUAlcC45zI4W8uN/XbTNaACUB802RMLFagTrmgij7xItwx6AmrfCN6cmqz9cH9DQ8zVHXaPF9H4/sDUXHqmzlfTIgqTwSUvmhYzL82rcU3/LThBK8yB7TAEzStFmCq5uSFoPq9VcQVFT+sCH5HppP8I4JbXm0e88bJwYxKsGwCudo+H3NdY4q5Spw7rZ1pBPl0G/WgerPsMFGo2GbP5qvp5IvJGSNBVSN32n+0quWKLMMVSIUShn5i6M5lNgpgNgW4TRu6j2SEK7C4u2zbAPTNE6nyKa9+qYcPK8lyJovjKOr0jlQDNWKBTUE7XZSyYQEa8laljBL5sPl3q00gT2xNER7WQfxgTNObGR13i+H3CTD4KizrF9HH/tiUH2lYM6t2vsF5uMo4aAgVGBajk+/A7zBBX4Ae0LERaB8fa4yHqPsv84bS/PrVa1jIrMGWKkPmEKhjhBfWYPbXP3PRfhlPyOcNKrLoMGeSVwbbA5veiTjL06pI1A4tmIH42eufQZ7khwdoV+u+YYonpaA21yl7cCBl6lb+6CQ1UWIggdGMxYi8105ZGXwowkWTOwMVpp48wmO2ZDGs30mac2cC9e6AhHJ2LbR9BGBJYGEjhBA0SK2rIGN+d9gahUuASvm2VtbGsI4fayjw3HJbkhuWaEW6NF/mFJ7YK0zOusY157qYBuTq7SZZhAl3hG6wkFLozJGJqcraNUirau9mR4GgajYiReH0ZjEDRCiohs7UVm4iBVxa2MCyNKloPVzCZOL9vlSK3mXDl8pcgGYV9eqAmgzCVWpusno5TpRE0BAjRcQp6uBh9fQ7laW4HIotYRoahCBWxnjsHknTJmfiaZKJ9gamgL0rYaTDhwGwirNFVxltBa7hSehh0SEiq1XpVyQjk4LAdRk4KoTQmh+tiOi1JXBGnqFo1QpqOIHTXAJxwh3OtrNpHOQQSXEgXLXCcZU7JKSNqpEIFaWqOKW8mUUVDhexxsnrvgjas0lYx/q08rSzDMmaMqIRcXqTKEOpxgoUyuF86pAwNTb5xvop7lfStgMx/bcum1lNf72AeZiTqca/eZveRqCOga91ihOp/MlTlKvO5+Z0jJp70glVQsybSweC+sYmnhfz3flfJCWV57LsuyhCAUns6+ZX2jSD/lR1XLTtIWkhGpJWrvBAgRkYhMNr9elxH4GmTTt9bX8abmR3yrrTlOmYgQoNmFWY1ZRfKwsFyC5Eq8mRJSnBAvyS8epKiEk9pv5Kuo2FyWcWVRgoCLw4hwrtnUDpzlWwv/iT4DiK600AfQVMoUrUJyek2kNOw0XeZn3bKaP16B5zXRItNyITlILSQOU5RaahMJukCPXQ/VaHKng2UYOYA0EVxdoxBXGNWgAAFFHNQxzKeKhSKG4EgksiyKAqcTaNu1cMuuSWQ+PptiANT75J1LQmy+774U6RIxpfA3KePqq1s8QJTO4miU6J9qGpomSQd59ZlZOuAiCjwHvNVIFZlontVi6ZDA1wWA1OGcZpUFVRNcwy/ga48AQG3BAhGRy9LfBnkIgLD64Aa+MDf2Lq/v1X9DP+ylWVxPFEqNR2QQZq59dgFxkvivS2Zd3xemQeENIFpKqftQ86IQIt6uLAm0XP4AS4i4BANwOYTB+IkYh0/eHMeXwLewIHYK/iy8T0qniLfNJ0gm98YYMUB9UYLYtNSRVi67CNpGY6TKWZHrQiWG1G6uIKyCcb6GVAIEFzvo6iRcG5QdA+4xZuhtfOEdPkxUsEOSdiA5Hy/G5AFIEBQUnjCQeKFB/PEZYeouwDj4CQBqTkHrC8ONF3joxmaaAJPadfSzxxucS05zqFjiXOKWjLAytVkQmb5VtQ4LLugYfQpg3zc01iCCtgMRfka9dqOm+UZ3RZLVAvFrRG9owDaBCSSH/U6nYCDuJAkh3tfu98oE7R0SDqo0cUZsXmI2VPOZGIUwzpK39GHiLnX9dDIIM0mcwVgRMmVhWQOiPuWE6aBccGJFLDRuFjmjhG5ImkaYRW7sFQg+ELV0TNLDelxghNb/inOFSuBYfLjSJA6JS8pqC6c5o8odDehalSCMN0FU66UhndmIIkCczWVNmFj2UmxLQZDVrTWBVXTlB2kQ/lHVKkgHH8BjGkmNt7iIR4PagtD7TDU9VfPVNqRnKvUgSzyRkEOcUpIUIB7PdpvgLGOTlVvybHC4OHO8xEqOljUVRx56mnY/6W+C2Q2SMEdlnMm0JZ/MGxjnqL8lYViGAyFE2ABpONfsRgpk64fNNxijVIeZ3aG4G2ReEncVgUhOoyys8+X4vNrAnDSDv0dGWlJhUtsR1RuYcZmqHHsUNd9IpMB7MIU3NwRHgt38b5GGZ6LaQAMppcznxJgufYosLJTJBNAYZBW4SLphky3S5xI46qCilRlki1Exu5wrb4gUcUFCJNxKPc59RlbtSBFprcMNvK829/34+Py1tc62VbEBg2EK16qqdN+cXJEK2Czh+tdFEWogW71hS8qQckMe0syfuiq3jvH5S7j3so+/7bZcEuYEiOmwct6WsXLp1ywLDKTS8k2G18G0UWbiVTtyaT1y4+Cr9Iuq01AuO6W7ihOIjljeKEpm+TfWxHLC+TNtl/YSmpoYl8LpKZvzypkUQSzFy6SirIOMzg8prt4V1YJDRC12aIUkeuNOrk7A9fTI9VDUuqgO+iXHuin2v3NbENoK2kwVwZ5pSV1bjBDsRIWThN5KLmlEhGzxRCb+JD3SkKzGLOOrG913w7rYP3RYq611XBzW1qqHaV+wCnNZuwl2G1aVSkrVOPHIlPFxtloivDxpj5QOWfU0epKFuapUq5NlhWvhdL3j+Uimob4FrtQKDUdi80iqUvogyCnRgvaW4ewos+B95FCGYHXbzEsOaJZBff1uxqVzqIQsqRmt3IjXlqtBUOv6wyb/PQ/X+PyfoC1Vu9KlljQnVkLXPM09zWc2OBL8rEInhTDC4nDQWdWNtlIn4arDWOtYD291621gvc+s0da3zje5CStyYNEPy1bjtb3ohOUkDHUKkklC7hvCbadmiVFEZJLx96r9T35SVGZsrA3d+Z4uuFHdWKyp2s2hZk1In9RLVkSuRqx2T+oo0YUJlrccFjHrQMNmYwUwgoX7qmhfB+IFd3nzsB7Bt9o9q1wbKGyeD0E76AU1Y86DOass0d22zqSDVGa6jySvaDa65YkXFZtVZm0yy7IEkRTOzwPCf0swH3bfsGfW1ZZi+CW0FYr/J5oPeNtrKw+aji1IEKkrNxrcSy1HVCul41wDm93qfbLu6w1xNxGv+xQPaIIYddD/nUuYWRJaqDmL5JrVZdZ6hpJ9kjgYOEGDCJkkQqmbMDld+0g1bssyEG8IDwEkXs5kRMnH0CP18/c/He/pO2nXhj/oYFBb8Pwdq7Xlo6pLlTilaqE8YLu9V0zU3eCwsm1lLGnGhXmNDHI14l0L1Ovq96Xc07zvsiR6clO4z0ekbRy2AF/MvphZlRIx7zVl+KuEaRVWxSypp/kGunB1uJuAijevjocmtW2xXcj16EsFlraKemwvGbOejuGhxIxW9YILpYGGh8wmBtH9KZHA6f5EVJbTxtFcfRGRSz5dc0Tp5aGHW8fZ9bZ1KW94no8gAqrUERsOI0wiVFuhVYX9Z7WUC0DiJTWYJ3bUGqL3b2WcfyvHgPkOEi495cQsBMN/9R6rNklEDORwVW2SDjJT8qJI3uQ0Dq8007B5Lx8Pk+BSI7zptO8FwOBXRE9o2p6cLPW8IFMe1Gazywpdnmb79RpS1Q36hFxdP+naANaNUn+LUvGS1cK17jE/TMI943Yoco6rFuYRKWxqObOqkHpLFC4avIpLv5mKtN5+rXWsu6113JiqtVAXpGuqxGs1CFD314DxSl/zN9DhQpkbF9RmqSopgolMS2OkIUIQZKBwTNFyvkWENKWgls1Tu8xHoekNgWOD2lE+4Vax3o86RbhqZGxJOJNnVa7Q3QKLwKE8pNkrRqw1rWLArHgYRtSXflzSvK91XI5auNY9huDiwQq+BjqCZA2XJTRnPgbzdJrnn0N6tqIli3aYuxTO/3wzqJRLraMtN6wvbsgDjbb6Voz5VG1NHIXJbzrSAurmHKSVclTAnRJiCKXZNs1cxGkPybp17eYQ4r0cPDQzNSYN1Ym5EKXBpK6Emj302wQ+GXje8DbL0kDKyix147Ii6v7eB4dVlkhfkTIOjMANQSPp1tlu/NdC3ym7Nhs8fSaCQO6pkqmy5xuTbP3hJm02Kk2jNyQMGAIu6V/ac0gYX5xLu8fVfun/IRYZIS0HL/rwpSQs+cgMg6fZRfyMXmaZeJEE8Z288Zxr5vkoiBKvdl1SO0idl0FSQX1cA481lCqhHx80vpCE0yAAP0AC2bj7aMXV5C4Y1sg1iXy4ILO0ToePCRYsdbmSpGwixhIXnHr/e8HTXGlhRafLAiOjGtIvuHTiZXpMbF8YgN+Fjqs2ZOqBpIwpN6oaJKGeOfM2Fxojs8JdZDfwmHIJf9iaR0OuPtUmVSPTwXpFvrA8K/aSicoQlz/ZFw6R98atH4P0gjRvNhJSGJtWYuOKIdy+48HzBuTWTedD4lBgfPoup/HwSFQpzzX9BaJ2Y6mS4GI6ZDifgW/kHodVWORQcXktxGFIHxaIJ4zDBTg7TqRxRtkQJZH1PZwD4/oGZJf0OwJu/api1AAqYyQ6gVWindkR1o4rGJuEHRlepnvsusHvTIVvFc04yWPWXSxtci2KorFfwm1aCGIr6UpXcu2wLC03ZBA2/HUa0fFG0+sn21RURRylv1gzPaY3y5W4GsknxFvFLKq0A0YAJn2JyMmBde7cOd49nHYVtFAH73uEA6ftVkZHx1XNUBnl4sJmKWjnQicIwaj+EyRz2it9SLw3G4OkCRFx7myguS6PUwebnhdHj+eKCFKYO1MGVSY1eWWMtEk2x/bACRFTxaEyF6BmluKoVQRBqpdEaQvKtbPokae9dnpVCMlZ/nC4L0wZcX0pJcTwVcKRDCwtYq9SghMMeLmm9rOqEu1DmZKLxBIO50L2EPfdRWlnSztrRG/3B27kki1uQpOXfNRy5itlf1VVl/48v1bEvp7gwzjjZK9cZtcZ1BKHBrwxfBh+G7HnWR7xHMyzLG1X+h7C79TepTlkfAJfU7fFM+3C6i5Dgig/1wZW3x1V/8k0UkOfhamfqaEc19Garp+06X0ANAHgwvwF+PM//3OY2bQJtm/bzttEPPfscyAT4+HqF1wNd97xYqilq0HFOwPMLc7D9PSUVjkgjljB3Pw8TE1MqEou76NzY6OjnNpp9XUXF5cYWKPtUQI5S2eqpUs1nsbHaI8ZWWtMxL+0tAyTk+Mgqq8klCzhu8cnJyBLPLRzc4v4ngkueu61tNDSwgqMtDy0xigHtuC87eWVFc6SGsc+8QbbTgrxLS2vwIapSYGZkxTH+YUFmJ6crE327By+e3wUWnmo2gWzFy9Ce2QE+z4atJWl+UWOOU5PTYBLuKzRlPfJ6iIdR4irJ5KHvpNW9MUvfQkefewx3ljuzhffCTdcex0j85e+9GV45NFHAkLffPNNDPcH7r+fi6vxu7BZmoPv+e7vxn62VAV1l0zEFtOmx+bn5+ALX/wCHHz6EMJ4BG570W3wwhe+EBbmF+DLX/4yHDr0NK+muvPOF8NN2KelpSX46Ec+gs/Nq0qfwVvf+hbesjZbxe5Mv4nDtQwVMiTrSQUHfh4+cgQ++elPq2e/gh3bt8Ntt94Cd999N9dptlRWIva3v+MdsGnTDHzt69+A+++7DwXYGLzmNa+BK/deyfWsklHD0M4Ng5/SCTRqjvmazuggiLq62sfKPe9BxDWWdBmacU+TIGTrbtiwAW69/XYYQefVxpkZbn58YhJWUAJT1tX27ds0Nua1NKxuCFVJtQ62p0U3ZY7MuxSyy16LYyt3o9AJZRupEAbJLsrxnEgkOlYoZbNXcgaZqITAkla84bpckW7tSqlPKqqXZ7HOsod5ZBIe2i3hoh18UWeZxjGC97VZajFtrcj7qaqj4Q1JWlIAsiILDLgHkvtN51jiVvIcZfTQETm7jNtxho9U5WfpwhUIy0BAQRWu0gT7/lS9YKWo5CQYfOzjH4cnHn8C3owIT3PzR3/8X+FdiIA33ngDfOqzn4HbX3Q77Nmzh5/ZtHkzfOSvPgLTG2fgxhtu4DYffuQRuA+RtPrud4O3xPzLEcHaNZKun/vc5+D8hQuI9HfBwuIi/Oc/+AD88A/9MDzxxBPMcF5912thfm4OfvO3/xO85z0/CWPIrL/8la/BD//oj4DVAJucnIK6szNqROGMcLuaiSBVT0W7orx835U9ox5DBkcF6V728pczAydmd+ToUTh58iS8+S1vZa3t7Nmz8KH/8iH4ju98O9z9N5/CPn0Z3oGwXEBm/au/8mvwkz/5E7B/35WwmhNW5m4IdLwoJ75B4A4Se14Juag/KosBM1OVQDKBiJjM88kqMmVUaXnMUeTKL33JS7SyvNgUe/VlaWxs0GT79N0uLuuqAlOpksJzoAzAemqMBpJheUi3xBTbV+8DqXJvgIsMSxbD0K4FJZ7sZl1oI+k5j0RLKnSltmWwRVRFamwH4tlJVgWVyblQu0HUPTWKzN7yQRuRac51fa4kvlRaeD2aDCa3UjimUqdJxMF2RUSlPZi/9rWvwf/rB38IDhzYz+2Q2fNXSKTXXnstrKDm8KIXvQg1qG1g7pxbUOrs2rUL9uzezcREEui73/1u0XgcwLcSIXA66je9+c0yvkw2sn74oYfh+Inj8F3f9S4+bxll3/zmPXAUiWg39mfjzEa4+cYbgxodmJXNQ4pUqc2uCG/e5VQjorYon3kZCfjkqZNwzXXXwg3XXx/aIFPprrvugptuuonNiI/81V/BS1/6UtZIPvaxv4Z/8S/+BWuf9C7SDj75qU/Cj/7wDweTcRgMBh++pkFJHR5IFvbXjyIMNCCVC7YAHbJPb6Z/6o0jG5e8zVketvcE5WoCUHN+KyE3EF6Mfl/rj9dzLvxnhBftCDdgCC4MQD5jsz4CIDwltbrsNNvlYKt2SMMYQcV7jCs9OiRcjLFBm5Z2VcIVtW6c9iXK7dCX2rsiTMwhw1avheh8fFaYSs5MUMJDkobDtZ174ocQxFOEUB3b9dlHKUFDcFzRZug7UBO6795vwratm9m0uf++e+EYEgUh3BxKuQ996EMwhar+VVeTyXMHvPjOOwNsn332WTh3/jy88JZblPggGftlELIzpmWZTbQTwSw888zT8NKXvST6MHC8s7Pn4djxI/C273grnD9/AY4cOQz/8Tf+I0xMjMOLUPO74brrw3pn3zADB33y69UJxTskVD1W3y1vf/bCLHziEx+HBx54AHbu3Mlw2Lt3L+zBP8L3WYTXN77xDfixH/uHcGF2Fqamp2EbMj6nZUeuueYauOeee2AFzSxSqYceQ0FnjFiZi4/wig9FPAvY7OLI2aFSqmNBVhN1Ym4tApfsElNnJYFe6l7Z+1kyZG6IiuVDNzP9C0jhpEtuyKDqI65/FwYQJb6cxf8qsw2T8evbubwta9WU47oMo9UFGO2RflxARfZgTk6cTvKaTIW+g/5KEBA5vcJXPtR7q85BUAchf1ZiU0nhP1kcTsRGMXQyW4RJSr6zS8sKOQcuAVotXc9DyjpBUiwL+P7v/344duwY/Pqv/Rr8BhLATrQbN6HfYgMi4E/8xE/A61//erju+hvga1/9GvzBBz4QNAWa28+gRHkZSpyRIk+YRr80GHT4Ib+D6o/vOXf+HHzgA38At9x2K7wAfSbi9UeiRgL5/d/7fXg5qrN79+zla//4H/80/n4ZE9fv/qffga989SuxYYN7ZYzSMgQjEdt7zQlLn51uh++llXfvfve74Lve+U647ZYXwrkzp+GX3/8+9LcsBm3nwfvuh61btsIuhB9x2MI80vzu6DceFPqqAcGtATH7SBh9wp7Dt8JaE9xzIcxjuZ7EJclDabEyc9CYVK6y1JGiHkN7iVtd0aprO672XXplak4GfYTiU8USIGK0leXMgmZRhY2ZTXlLnDw8LtopfRHmjn8Opq44AK59G3SyEW6tl4nHlmp95awm29roxsi8vjshXpHaCWGFP1astcKhOOostTbPMt29vRvCF+FoqK5pVQxXuyeCyeKW5Kv4sX/wD1gykAPnsccfF+cRMuOr9h8Ii+pfcPVV8Evvex/bc5Po5Dt16hTe9zS8G51XlyNtXd9vxTcFEDnv/gBtX1LVv+Nt38HMi+BzYfYC/Mf/+Btwyy23wpvf9CbGK5Jo1117fTCNqCYVqdcvf9nLtTpS4htIJLK8SoDP5kyaK67zQWYh2cLbt+9AibqdBRY51P79v//3rL5fg6YGzcunPvlJeOe7vouZzNj4GGsvCwvzqBFM8HtOoK08NTXFpmW/ADMNCtaEmDH/LGGYPrliX7lQlE+KQHtOXKBcZikwJ0vVRkLKpNnAvCiBpUdKvNYHV0Nxs/VqQ3GiOkUpRXZixX/0H6/vKHEAsrEMWEC7girAQazFJLkBfxckzbj0idSMWvA9OLo8Dx3zptMfeRJB3iMxWJzQ8ixUZ74Bfukodr9HEGAkyLWyBBEw7XVDT9CVEqQovSFACeIQYVuYWbCMhVZTt5R3cH/J20ndp31vaMdFyvRpZbxYwew1mjRS60giiK1XEzDrOtLYJn0pcc6WyRs/NY1IN4+Rg/8Gr0Xn0TNPPQ2fuvuTTLAr6Ox64JGHoI1ENMopsA4++/nPMyITA6ibBwOYWLjW/9NsfnEoybyfuzgHv/Hbvw37UD19y5vfKt7ylS5cvHgBHVe/Bbfffifc9ZrX8T5BtCXM5z73BXjo4YdZO6Hd6+9HNXf37j0QEk/0ZcxKnYuVUDnGJ87MnhIxoRHVZJOlgXgPahezsxfho3/1UTh9+jT39Tn0SJ8+dxY2b9nCrpAHHnyAvRzXXncNv3PL1q1w5b598F/+6I850nHmzFn4y7/8S/Sa3zkktLU2AzRYsdXmMkgW+UJjLSGfKkKzPhh4YHxSXOYx60qcWFLrllVsiDauM/U3MBhXe1FdLuhvF7mNIXipJTU5gxq70yNbUDd8sx528dJRv0LWKkzAqNjbTorW0QZePU7GECJ7dPE8/PXBe+Ef7dgO24qcPcEX8woOVnNwrdsA0zz3GdvA6HdmVZYwia0zeqlAku1hAhGdz1UDyCvd1Q/vv4BuzAudRZiEKWh52WSMSLKL1Ngj1VhZKTtQqHB9nkmGjzIQjx7xDnrQxwi+mTgA2ZyppA4T6yDO6bYpqy3zVgnn4n5A9NwJ9Jz+/u/9Lntaac7e8pY3w4tRLZ5FZ9ax40fhvb/4Xp7bjRun4UfQyzuC4ax5DOecP3sO1crvqoV/6tM7QB9MflYhyUVL8yrx0n5cD977NTh++FlYWVjkkBXBfv+Bq9FRtRmePXSUQ3hf+eqXWCW+6cabMZR0M4eR/viP/5j7s+/KK+GNb3qjhVwDasXyxSzDwCEH7eUSpuQkDXIUcmSAPlrhvrGRNhSokfzab/zfZBtC3h6B7/3u74HNmzfh7xIeQobxrnd+J3qmRxiuFNb80R/5Efjwhz8M//pf/5+MR29+05vhDvQhWLhpqKd+ANjq57VoIYQdVUw3j1qXTwu7KyFGIOia3UxU58oQSbm6i49BGsqQllfjNC6RJvX7zLup/VdNWfZrqlQHpXOUWv7Fw0/B1vEp2HXV9UzsVcIYKPkt1+e7+MyCFa30LNTh2PIC/Pnj98D/Mr0Jpsamwh5KWRBxog6TV/oimgij+DcpxRpCz4lAHddc9rCC3x9aPAf3P/Ug/PCO18MWYgiVALZLVFRK9hbbS0ioBTIfQogee888b3ny+OIF2DGOMeheC0Yp3xZf0O2VDfOkDsdh8OX581AzSnbt2gk/+Z73wDLac1MYehlFdZRgsQmly/f/wA/AHEof0g4m0JHVHm0z8ZPK+oM/+IO8w2FTfV+7H3JITSgWB6R2gOg+jhNrXvLiV2CM9U6tPCJ2K6n0FE571ateBV51LKoRRf0dxZDOVft/AjWIi5zQMo3aRLrdqgw1hogEZXTbGMpcoxLHkHMcuKQFCnkWalrRHlIZxrdf+8bXw53oSCsxfDg+Ns65Ahx4wNDku9A7TolJhoc0J+RM+97v/bsovWc5LElOLc6u9GvoSmsKYxfGU2OWyXPepZlYzgUXvEhVVR3JCeJ8kMIAppW5SMgDwhlrdiz5ZhI7R6QdqTJOlrDq9nklhGW1hInoCfHO41S0cYJLgGRHBicF8tSJXjnLJJN81kyRcBkxZpbCYqS2V1ZU13KgpS1qgtIF7n76Ubhy1x6Y2b5HN5ryrCWE3HAQT+EitreAzj+SbwwzT3FkDxcRMWbw2gh1mswQJ1KJYsGknneKHixjxz5//BC8aMcVsG1yGiW4bgoNKomdg1p4rDH7dWauEjiZZKfwm0QGMYVIKdU5BDc4ARWJaQbDM8a/vV6jOWfbzodsanmTAcpUp1UOK+wXPPT2YvxC+0+P4V8PQ3cZo2IBFomgcFWY9ErxygGbFSQRReq6OhCs74QzIJpcmZTE4QLHhMsjaLIgjLuUbeWjZsCeaATYzPgkVNO5MHzaLcSLN2ZyYlJm3VR2Ff2UD0EOQSNqnaQBsBkmdtc4glDpZwpZ/X02TT6eNNvRqWoiuhxYPqmpKpDGOQGCfezrEXWoGSsB6l7VRVKPXQg4ifYqKjTPX5oPXYmH2btY6y+rxKoF55Ix47ShJ2qEELLi5Vc4SaQaIye2fFwvanJaapUEKPmfj/eW4SR6pnn3IO6bvU8kCdvPTmzlosq1eLhoBEdXFuAjj9wLRzoLsFx2MNbZY9We/vKW1FEim71AO7+D4+l5rSmWLgoHCLu4D5t8N+BXlYwjEJH22wicWZs6cgzhxJ6UFNWabZm27b0uUFnrMK+swFgWy2iAkZhrVmnusNRd4zIPlLJKFf+9M9dj2pz2woUwS/R/RG+z4KGkQua8gTba0OQXSUIeBZ4fod1AfK4p5rLIQxKOnNR9I55L5lAmpl3ojPe13SyMdrKQ363j9r7e8XUQb+rl9zHeGGDYPBqJHOFZSFXqsFpDKTkNWxCHI1c+FbbeguoYudw7GlqiYzd6F3diAN7yqC026byrTQ8hxXmkrq/PnYRbNuyGHb4dGElWiTpvajVNbKtH0jmvsYMyE9tzxUnMlB1cROhe9l9ScxYnJcPn81jIwwljKJX4K12DKdJcpTrofrwVWz94bw9ssYFXddmVfAcX+6bJm3dExIuwBMKUCC4ZrUmjflLGFjqvKtpalSo5+FyQW3PDNUIdtKGoPq2Pg1vpXCIQMiPIQVVlmZpFjm15tMShrWMzbYJzzEvZaK5ot8Txg4zHaz5A6l1dBzpiH3rJd8eOPefn8feiEJmnPPkRGTcRG/shZGvNbncZ8aKl+CfOJ/KiU3YUL7bHPo60R7h1c0YxzCodj5OFKISbXku98j69XhJn8koKAXbzGH1Zpn+RiaxgfHgMIUOtcylf5wKTYHUZ30d9IU89+Q6WEO8n0PtM2UJL6BC0RKhNmzbDeufM8LsmqbUdiaJU4aqVMy6CAwASZusiVxFNIUrYiFD6DA7uzOmzMDc/h564FU7bO3LkKAOZt/JAhN2+Y6eoRs6Wb4n6Ko6ximOxlPN7vFqCu597FL17M7BZc0C59LEnW7KEFbJbKrFjWSz3nCCbhrkojZLsTY+q7IrrMSFmvH0L4MTguZ6EgTw10JN30kQV1IdKduhjD3ivw1KBpi8nU4lqLJPdhP1fxv4/NXcGlnBst07uZI82DYsyiSjvWtJOEdnxXRm+ZyQfQRsaPcqUqJELAlYIpxztSt72hBY6UCICxatQEhdVtHU5MwtS1RnWIfXizXTvOdQg5pAAHz9+GGC8DSuLiHQzU5B3StiUj8I1m7bBmOjL7FVfmJ+H5w4e4vHRHF7EMA8JFipaTtLs5ptuREfXTBPNVumH1T4mwsLoxdIZmD1+P9qkFxE/VqA1it7tUbRvp/dDPnoA52yEpRvtZfxVjEl7P4aMbxFvabN9THnohH+UCz+OdrER9949e2D33j2iRTmvUQjPjqos103kNZOQGX1JyI/sAq+f7C7wHCwtI6xwMslLf7pahk0jYzCB0YDd7UnYPTYdwlcnTpyEp58+yCEv3vmCwlKkomNkYXp6A9LDKVjGtvbs2a2qtVsfCbsGUD3EaEI8BUbSdBSrNuZsh1W1PgfYugScV6LDgWs/o1pIQLv99koTP9BLPD6hJU1V/IFIuyzZtJqa4pU9XcfhK1JxKcbHzg8ksllkg5tHctmLhrgO2aCy5Rs7htqZSLiLzE1L2OAy5cYYAqPVPCC50S1apKDfPRIUOTaovjI5N4gbEzcjBKD3UJo4ESu9h7k3ThAGfDg/+vHzZ+BMdx5u2rkT2vQsVKEECzuqSC1r0XlU0fCvTT1AJwhpACP4vlNLC/i+LowhcVMoY8XRogtZdUUjZAdc5qCpgF3aIdrIk8ePwFkqsD81DqcXZvGdLZQQi1AtL8EpbHjz2ATsHp0ES8QZR9uTkhTc2Kj4ETTqQNKSEkI4u8iB6QZrd4PNHNJ+Osg4MdZ+/mn8PA1jm1owe55qj3dg7vQzeC6DqW27EU/aoiEgvG+46Xp80Zju86Ted/zsdLq1Sp3EBMnBlVKAaXu+istBySnI0QwX/S5k4z6KnvAKCfEExp4XJgpmpCVJaGQsh04dg6UNm9FhOo3ailTloGw1yhu3VE7uA0YWelpq58BV+3kDbyryDusl3r4jmf2EczuIn3SqiGqZSy66+JkMFhrX6SDuQ1xG3qXqsYOa8yy83zU4tvfJPQgEVInRp8NOA0ORWUT0jx58CF6N4YWbprexXM60gj7bvercIWfWA2eOI5IuwjuuuRFGkTg5skrMoRRbTyZcMq9IOrY8cKV9x2mU0S7Mgp0GkofqbbsZiwmTWqpqtRcHU84ON2CnCBNDLk6TEt3QyziGbkmbPBcwh98/+dwTcOu+AxjwH4cW2oHUVtnpsepcJuZJJyPbGJ0nAOrSMpN9bdnnVLO6bvc+uICS7plTJ2C6PYVx7i5sQYTMMH42vziPzE8ca6xtoWf8kUcfRem3AlvRa3361BlmTJxUgkRCmWFtRNQbbryBnUx+HbLFgfUUoYESbcOOq2EROfIKjm3yikn2S0y3diLvnuSFN1mm+eaIVyTpO8jUD6NG99yzz7IHmFa7kfQkTznNCSVN7GXJC6EkkW0jWltTTJ9ZFiIdmdr+bcST2w68AAk5xzDgChydP0+qGUrrCnZObIaVEWRuCI/gvALgnUZI+lKG4le/+lVU49toKl4BBw8+zecpr5wW9ASd+HIo2BbyM8ep+i/rZxJG0k1qQL5nztdFuk8I2dVnKMQkaxI6eZn3YXNIsX2NnfgAbGMhvoqOKmqXPLlPY4jlupVlDVULoZB3umCCEZWJWjm5vALPLsxxnHhciYHdJqUL+VnsO6HelKD+BvV4Z062VlGGZjY7MxSWzqDF72XisyrXAt6EbAXb4+z05nW1XlIg8b3lMhIvElDZzdnpNo/vfnZpEQ70SvaEOl4TjVIauX7bZ1oIEO14FMNfR8/0EjKAN15/C0wa1Fzs21oHqVcz2PaGkQJ2X3FAJKpWpGCIT2xgZw7PrWTWYNgEw0hIKLTKh2xHW8QiSC+aki3B9Kn9NegQbqnOwUIciq1tMEUM37zSRGSI6yMMSnHsqUsB/0cNhSYZ4UQJE13OTivQDm9zHjP1bYQlL0Rmkrla+qEth2UNKZdISnC+5hReAtiej/I4to2OwAtGp9R3UrFNzqhPq9mc4I5sSWUJTgVcc+11HA8eRWlNedAM91xww9ZOr4eG4z3R1wO+nz022ypSZBUu4xNwuLoYXffReI2LOrt9kmevq6qvlSDPWIplQXpwC2TH9FxfXTR2VFSu5rXjsJNtHek1z9mrE8omVR1oFLIKyoe1YDZHctolyJ2+mxmA3sDaQy5eTfBJhQlaEAF5YE+VinV5NnLHEP9We46+L+GV56oVzkKSvc5p20pVI9ciHIDgeMx0MIRMlar40RsoCGo+MkLIK/fuhVNnzsCpkydQBWyHouVFITsR7LtyL6uLrKmsupAemupWFAihkIJ4HbgPWdRthZGjb+XsWV66R1lOFJ8mhrKCjJy8+Vs2b4Gz2M/zS0uwgHFhksJkswdBo5pgpUs4DeLB056itsJSmLQWRjHiNYJXkBEDpJVclGJKKjlpJZSpyJ+oHRCMaPEHwebA/v2wbesWWA/ppPfYfkg+/MXk4kDkehSG+GFA3hDNr8k5huNRPGnkIPLdB/uDwi1k6+YqxEzlJqmV+ZjHzMRW5uIxhNh1KjSWVfX3EFGmhMlIVokXu640OH3Whd/xexw7/670XuUK0nfHzjG+jxZyUCoevmeEVmeRmkYJGKrit9HOHSnaIgGcMKusLEC22RRVjsNGHIKyWLXYNlL1t2RG5HxYCAUO1iAcgBBm4XfoiApn+cHpxJkaLCMmG3P2wjl0Xs2hejrNmWDkYaVUytwqsWiWEayDkaRQjx/SD7EWkq1tXTIPTiQZLWggfORdPVA9pbj07MVZXoRBhLy0uAB+dCwwEzPfwky7RBIDQDPpyNU8uOJzyVMmB7J2OQQZSXAXshk9FTugNfCyYi9nRkFFB3Iu+J4lhR3Xd/j13KELdow2ixpQdSITJXfVYz1zF+SM13W3IDUGSM1d9qBqbnJjpWGNRGrnnYKJ2CXaQEY2pY+oJ+/Ac2UO6fbYfE+ZRYKkB4j4y1hWk9tw9lknZmYopSKZTjIRb17afZITzoyDiJgTBjx7bcELo2mjakjhDl6mv4KOlI5nFVxDrqwdENNyPu5dNIrnJroFLHUEdhw/1glL1jCsb358tFVDbDdwZ8F4W6FDSHfj9TeAhdZcILboGJKn1oslfb2K/aidgYSogX0SM0gcL37xi2u5BM7F8NrOHdsgqcXLR9XXttMh+j7ibUJRND9XM11FAscaWPTujcjMZjZshJD84xz4GiiUGSZMcj0zFmjFBEoqscL4I9TVQmm+2NcaXO1Yc/rCmyI3o7IllJN6GOOjn3jsAThf9UKNKQ7e9ySNEBRhWVr2MnYSgY8ZUGRzkioZTCm6F4kq78mLq8DwHUu32CevEjTX4coaaAhqspkRAk6W3qURtIVDhDBBEa5FHlGyj3pSSaOlMckehkLIC5UlsOU47IoXVd8JcmTa90zVf2qaGR0xLWZIHDGrZZ2tCXSlBB++hw+oFwqICB9Wk2kOr+U9ZC5R+FMVdN3Sd2gva0dzPXMoQBfWo2chYUIYippQ1m+XJhdZQ/V+O0jvh9p9gXu4BEaWz2z45OvjN9ioC0X/XKPEj1s/ENInsrUeCbpY5GLe7LR4BlZ9yZCmfXKDS07KzvLocPJdeArDGkt8g9zB64OrxF7VvxwdQFmZJWcE4Z2vA4mepawrITW1HXSP5bR3bBOXip4Oop0LLkgce8ASOSwXm1PvSlGhqZ/m1PHobOqguKRqOWwzonpFcdOVRTzXkdgwV9vQPhZkQihe5Nz3PFH1hQGV5A8ohcBJpTY2tHqerbXQP3N+yPm12hr863Kkb72t2Jf1tBXvbI5jUL9SaRsUt8C4BuBqf0ODe+AGnm1+rHkMbquuAViGWexckyn4sOAWTJWy5n243TVfO7A7Pln3GsJDSWobqJArDWmJgLpOcn692ZaIqGXGYaRcU+mYSHpm2/rYHKusrlYQgNTagu71Qoq5ErXT/GpDbbGBpa+1KomqItmKGT6l+fRe0wedtm0MxdIvKV4KnMEkez9RS0TEY2j/0v2VPpupWs0jVxWWuXblgorudGIYFsi8JP2zklVQA6ZhLaRx67rrUg8Hl38I+cV+uVXui+/zA877vl8NppNI57St9B0D3+77DYTBtFuXUuuFytARJ34FB1GNNixtMj22gcXWkcGvDtpBr/VcjZEGTF7MDnstFaHxaI+O8naJ9h9JFkLiSSS2yUWx9cRdLl5oV6pTDbR2EQgB8iBcsuDRZ7FuEKgaU4kXu5417BPi1cGCMAC7nqzuhyiHlS0YoesXVqF0hZFPAJQp56RxUIWHgnZqB5GuAYm8OrGUoRjxlizxs2SipNmilLI60u2IwE3VddCsGAOtSyof2orQiXNfP5ceaa9iEMutSnzD2opX6tacG/BWV3srgx3IKqnYDOMkHpcFxuYbNqdbtVcw8J3Ws5hnCxDc9Em/nPYoihATglBXOcN7Lufw2mQMg4IGZO0ohCg0x5L7kYkRVnMODJsC+efzn/8CVya47rrruWwLeQlztR2oVOiePTu5XbZZdYlt1kUJ1lPnUiaTSeppDnGVDy+dV6I2Cub1syw5nTTEub0i7Emqc5qkt6Fq70udDDrBklziwBzL5fpX4q3OvQTwQdVoixO3OPxCZXdGJDOJitmTqoz68grau6NOypS2KIOLg6UFEzQtUiAvNaWXpup6RrFl9mIT5HuCEJWUrBUO7EGKg+ccV84gxtFBNQVYyxPNikQlXlhdMieAlbBN5aRwPK3YKpRRectYsdi6ryLyqn3Oi0t0eWAeGB2s2ZeI2za7hlleSSEPq6ZEMakCXfAdeGEBTxxCr/SDxw+z83Mqa8Gd+/fDDoQ7paBWuWhPlTqdcp+wG1dF5q2JO1ay1dmCFjCU8pwpKFVd1IfvtN4bLdBxlD6B0scvAAexMV7Nz9GSRVAT0JWclstZeTr+0jWXkvQfgRU4p+FDB3lgXVmTl8SSOtFz6/oAP+yQthzs2n0FHD1yDGN1E+xt3bxpM2fvUAiijbFEsnlN+njZShVGkBBaHcpDFpWB0JhU5RY6eApOK6QX5ExQo1QcnSpWVOIA4+erJWiVgqQlqae0BzG+s0339WT1CKUf5D1ayrfEhNfNK0nhxO9t7EjB+73SnFA20igs5BugW2BQv+pCjxlZG8bw+yjNW9liqU8ZXWP4t8IV5zJeKDCCDitKsxvHPrRzWQHDCSk4CNfpiOeYbV5Kx8R3Y58Y4RivZKkjjbEoo9ygJZwjJdVqWo7hI7d+Xk6EWeWCLsEH7wRpPasQyxKq0UUjVdbj8VGqKfHvTBdkdPFch/PHKwnJOdmAutDtTQe5QWvKKiF85hKtTvUbrsHrREug92TSVIuTe8SIyBL1cQn//ca5U/D1Zw7Cnh27YBKZ5NmFOfiTh++HN7zgRjgwPgltYnael/mC8nFmimSt5YEQpcRSNH5EGAiBVsqWNCJAJX2dEk6Vq4ebaPMUzJ+8H8rzGCufvgLGd94KWbExMKcqLH0BjSzICitOIPItWC18Y0LR1846GAhlGuvP/NP/z89l5pHzUgWgQkKamML4ZStbk8PSc1s2b8ag9T6MzU1xbSOqibvvyn18jlZr0BIxbsmpGuw8ZwBt2TABe7bMSNkaHOdoK4eZ6VHYtXWDvJsQDJFlanwU9u3eDOMtqSFNkzQ6MQZ7t8/Axom2rPHE9kZHc9i1ZQLbHcP2Kj4/OpLB1k1jsGPLhrD9JtWN3rJxAp+fRuKjfuVcA7s1NgNjG67GGzZxrjS9f2Z8BHZum4GJ8ZxrYpEwGxttwxXbN2IblMFDbu8OM67tm6dg28yE4CWtScWQ0gy+54ptG6BNVMz52I7HuHfHRuyH43VNxFSmJkbgyh3T+B5bE4tMYRTfvXkatkyNacqoT7j3GqSsq71EsFB5n45KIpPGTsaoctSH8yJp6O6j5yr4yoMn4L5HF+Dz3zwO33jsDDx0aBaOnLgAUyM5bJwc7SNg18Azr2GPaP6YFBQErPQiE5AzaSmSxwTjMmXjYXz184cOwoEdiF/jM7CpNQIzJBwQgvcdfhY2bdoIm9DfYMv7s/AqF9rj5aAaJuRMedZ2KvXwV5xim4cwpvwB90sWwZS8MH0Rlk98Ey48exDa0zvg9KlH0VxCxj2+DeKSTxmp1COT5YgChQxqW73WQRW6yzOG/Z2bX9H1Aj74Syxz0UDpjp48563KBgGzRInYWc5g+44JmBjN1yTgWH9Y1RXlLpIvICoZcx/eI5ikItksPUaYspKhyj45xOl6uj1RS9vpYp9yloZ5pqVsnDivuiCOHrE9K40Cmc0kKp6kPWa8KimmK6gdCJ7T6MSBpoq776hq1eKVRywkeKN2yZeuelKtK8tGUGUWpiSpeiixS1FJ80w4Nv9RBQjqe87L/JEBtJg/05h4dPhPW+0tLjSvTK5S47pSta5lCOANvjYnJtUGq2W2+Ex86BUjewki9XK9P1O1TuxlqYM2vwzwmW+egEMnZmFyehp2IpPlHShQ41xCrWl57gLccuU03LBvoyRVrYIjtpqK59mIFSKy0ndKKT2Lc39meR52jk3BFAiukH1H0DyD+PIXjzwEk6NT8AJaQMLE1+NG5xAXHjp5AvLOMnzntTfDdCaLUmh8VfBLqERTXVbU9EpxJGecpJOyXBSU21RJbrXjQg28FLJ7CI48+HGY3HAVFBt3QXf2KVg4fxz23vhGcKO7QaqOjPB8Sd011bS4T0kuQwBCfd7MidXBgR9H+JNJ1ipkxV5Mdw7z74s6MsSkaYuvwhqJ8y7pkWXVCGJ4gBAB1fCMERHe11le5qr8W7fvSMiupaVgnKgvIHm4Rw+fgq1bNsEEVURw4vgRVIwL+uk4c+o0hnE87Ni5PcQRAcSjLXV5rBJkBufOzcKGDZOy7y7Dhq611BaSwnP0/ciJU7ABpf3Mxo28GKFH63cpW4cr00kyiccflJFLZoPwds7Kl3XLjAG5rJ7CMysYajp69AhsmdkAkyhdicGUVDzfCagtBZJQ68Lp4zz+bagycqphMtaamtp3BhL/gePRHLvQgQcPnYHjZ0ouoLdz8yi8+NotsGmGLOBStVkPx2cBPvbZZ6DMJ+GWm66CSdQ8RkllJhQmpuvHodw6jhoNLY+0tJzhh1VXUXAKM7VsIloGip9n0Jfw8cceQDW6gEls71XoS9ma50z8y3j9K8ee49JEN2zfCWOZFD+UkkaeV3rdgucffPJxePbsabh563ZmRlwEAiDJAFTvvtczrDkVmu66jOh2DpYuPodmzzJK1s1CjDAh6jSaUS1mGl24+Nz9SEwTMLX1SraPJzddAyvI0M4c+SZsvYoWeGzl+zOS1HNHIW9NQz66je1mKQZVgGkFMGDewlmfesebNGi/fVSAfKMB72BNLa3+RkOjunRIG7d30LQvLS3Cl7/yJehS4JSZhSyG12Io0gGqz4wI+OTjT8HBpw6GRkTS+8BlhFArOHXqGHzxS59DKdIDcRWbV4TuK8ESSmg958c+8Qk4PzsXObOvlDNbqTmRqJ/+3GfhyYOPIeKu8DtJtS+4zGTJoaGylB0aDx58Cj7/hc/y2uS4L68HkSEApv4urSzBvQ/cA0cOP8NOM9DamBbzc7oNKi1N+9SnPwUfx34urXRgXWpzAmVmLKSG4d/dDxyDD979KBybRWaA5sme7Vtg9nwX/uSvHoT7Hr8AFzoZzJY5PHqsA3/2N49Aa2ICbr95O1wxk8Om0QzGkIApw4zUf1o/PzmGRF1kSgz9uJP2JQgZhf08Mo/j3WV0SAmDR1cQfPXos1COTMIN264BV0zC3U8/AScwmnER5/Xes6fg4InTcNPuAzBF1TKBljhgX1BLG3Fo5iGsN4+MwC1XXAkzY+PMXE0ISIqwJnjQf5TQoxvcURGfjpeta8rFI3DykU/D/OGH4eLJg3Dikc/D0nNfQN2dnGWL7E/w6HNZvvgQnD15DLbsuAFtdWT+FfYG+z214zq4cG4OZo/fB72Vh6C3cC+cf+5TcPLQV1Cpm9cFPFJjza8BsfosGr4Pe8JBEV1RjZBxkMCwziPe3PdIWCChqg3IcjAuCapIG9QD8gp7KX5Guj0VH5ufPws33HCN2ukVS9NKrR1LrGOPHXJtytkloiKb1ryLoknZXrqO9yrahNJvZYnQZ4NIBKpO6OM4OFuLtonZcwV0uytIwFRqdoQdOLwgkZxfva7Uc0Zie+LgQTh+/CjcdOsLYfNMS/rlSlXjTbz2YGJ6Avbt3w1XXf0CYVBOiNwyi0DHRfbYth1XSL1iF8HrarM0eFJBIAkXl0r46OefhAsrGbzsRdivUfKYUxE9gF07J5GBbYdvPPIU3P/oYQwBOlhYyeHq/fthL15j896rc7OSEjQiQUlqdtmMcDWrdpWD+Z04p06urMAXDz0OOzZvgx3oeDqxOAfPzl6El+1HqTs6DuNju9DL/Bx84vFH0c4egbnOArxoz9VwYGwCzZMee5jJtCCHH6/Ezrswhh2kHOkpqipJ78ssGchMJsu1rlRQCJwZ6/H34gI6OVubYGrjbpTcVCVlDi6ePwjz5z8JU5t3QjaxEVawn+dRE5jYdS0UG7Zx4QEJZZUwPr0btu5qw8XTh2Dx7KOCT8UITG+7HrKxnWgDi5YD3uTcahptBJqZRkF3NTyCROs9evK8t/o+ZHtRJZweTuS2HeNiA/taq0OO1SmdSdeL+lT4UiWs2sCZ2UMGYK/OC1rP67hqgkeuTQTmtE4M1652ku7PUoxVOyqP0uNQVYbXSvI4e1FxST2uVHUSm4aWfKKl4nLtnVN7rIpEriGqFS6IA/wO5Pdc7JBU0g56iKmsLDEbIrbZpS6cPnca9u7dzbnPdFRZyX2gcFCWlTwuqsNVYT9JgnB3cgqDdWUfJhAnizDQCj3dsuXnCBuQhS74UKNujTASzeXpuS586RvPwv4DB2DTFLIfJ/NAHlpyrPR6tCa4g3F8x3Y5OdpmJtF5xuvQS2V+jrddpeIHmTp9MAYI0+h0G2+tEcoCwYyKnWjiaziN8//k+Ytw+sIsMoxFyjuFPTPbYP+GcXxHj2E7u1zB6aVljmKMI2PZOTkNo6i+GqPvitsDpaDsQslb4eCLNuUjuhBBENocWXGL9pJroTGcKZbnBRDdznn8uwBjbam6QRvSLS1cgM7ccZTCF6DbQ99IMYaOqhmY3rIbiqKF3vmWRFmcbBtA9cwWkMiR0rlARNZG5X5qC2StDeLbMO3OZcNJxUdJyzbwyVm+t1WUEpYNBoGtWUdMPXrygs/U+0cRHVq+1kUCjk4shcLQGTIvo9cF6aAOErGHM2/EAWrYK7F7lyxm8SGZRCSWXFArV2PqTiWq5kMr8WVBKRF3vZhbTiUbqPSr9E77FySso09W1rZJXxAEAWY6XdkvGbRcbSGOqZJ3GJS9lrj+lpOl1caQhOMrt+AuaWzXJXChy5k4mcCbjRtlqPHezBwXNT65OlOlpwkJTp1bQekqOytKbDeZA4UG2Zck1UY0lMMQyrwuoqB9k3sc4+a0Un62C5MTqMIWa0eBQ8K/jqSDPy6uVDCHmsUi2Yr4whn0KI/kNAs9nSEkkIoqR5b4XnEximbmWep2eVtV4N0vGaYZu+YwtNTijc9teaqtpzVPeJgX/iETzCEkqheGocbC68oRml9kqFQLrLd4ATg/llaVoZTn9dOKTx0KUeYyPzR9PbBVZZ61ANIW8mKUoxwSR8/WVFeshA6l0Z84cZHt/KLwPC7nAraG2+NO2knLFVzC4RLt3FVRqfK2tkmzl5yRhiF0XV2oWdB6IQ83Jsq5S1tJvpmmoG1myXvsl0v/Td6dNdoCc945sTIyF7OuKl3yx84zL8kqPlNG42L/pBlT342gXVzx4mxorEeEMcZZyJLfSnJNGh6g+PjkaTLVN4wVVl05ZIPZQ5b3rju51mASIezZ688MIAOteZytLv+TfrlkbqVfGIZDYh1pFbDRy7gzb86wuEKsyFNvK8h17eAI75AhyywF3rYrRpKDZ+aQi/4IaOCE+E9MQFD7I+E6ryWnVWTTW5JuSISBl3kyTvc4aUeiAxWnvEpRCIEfl7Hl92jxxTWIN3bO10ApZzNwiQfa7koWLArHCpzKw7oOYRgVd5eLsIt70GQpOwCcX1fP19LEV3/okp9bva2wqAGU4EzSc2KCkbzTTcciUabdcI3P/h9DTw2951La4jh6oZ7ycD25I5ljX8ebcBBZlZycEp/PIN2BY5XODjisqgcjva4pjpusp6P0tX/TxgnPyFYtXERm9llAI7Gx2Y9h+MWOriy8xxiuSe/QM2fWqBPpLo4XuUfNDUECH+1s2w1zTTN0lcNbP/oJu7AvXjlWkB7rfJ/TrBnR37MEPj6sJ103cbn10XBdCg1v/5L5QaMtl4g8AU9cNytM3EFfcfHnhZE8P0emksSGMah7Pvnisv57bP1/oasvM69SeD3jHPBCXrBCn5kaMyoNo+iIOoRvaIf8r2aEsDpvG43rc0F++/pz9q0fpxOGkRkOaxuGuz5mPjtN0axUm5KPAlLoij+l0h7lAFlKEcPRI17TTqiJGUwa5Uge6osvgoPT9l+pgs3iGsLaDXyt5LGqHSeQ1VQyUTeNU5u9W0+pcFHSO6gtDjDVO2SeDFQXVW314uF0/fMW7oTQFiSEGnsDCSertaXnjLtKv2B1DA59Tdpfz3G5zw1viDPZuKxMn0rV33pKPtaOmmSsZlvTvH9v4z0DD1dvi7HK6XrZzGnCSkq8xjRdgoXSUJCNnOkid+cuJVAXCK75zngHDL5G/SFrMvMNkgfZVN7MHh+/M1yYk4kvxjkbC2N+bFr0Axh4NLX6+qvBpcOptefD81JSJ4iYdJjR+TCMePnZagHcwjHO8wV0mXsML5Ax36KkZ1dyBgtVf/TeiFjT130iE0jlsFU3lddyLYJ0XDTdJa/UT77dWJR+NwuBl/3p5FZKfJI4oAgAPuEWPtSw4gTySsujgHDyYNf6PtbTB49kNWZtbLBeUnTxy+UTrzWkvSTktGwprcvt4vzX2PP/r7mrWa7rKMLd51qOpTiOZMeJpUCQ8wAUiTfsCDwBlRcAtmwwL0AqeQErO5bwBPAEwRRFsSR4FSpUrColkuxg3+t/XUn3NNM9fz0/58eSEzL21T33nJlv/vpnzkxPT/ntNRuf9EdKhflJPxX8Y6J6iRSzRfc3DWhVkRS/2gJObDR28slb8XnXQaDKLNdOgdQDpt/NCEGESmmAtbm2ZzC1EIY5AJGpdZmhUqNCIdWeeZrVsVwd0e5GmpkGWFU2KxlYPwO3T3fgq3/83qzBnYMLP/41tOfMWppZhH80nZoZ+kPYv3vPrItetgxmZrj5sCj2G8SNLh72DVO9uvoqzGYzeGjWA3nm73tvvglzMV6whZ/evw8bGxuwu7cHKysvyzk+z54+E2fyq6urgivHnpq07HDNH+nCJ6jzAVjoDslmf8LynA3zJ3aKjB1zP2W/SiYr9nb4lH0aGYpnZ2q8pswHafHpEpz2YH4gXhF5zfHAxGPH9Wx9xc7fuPzsAkYGToZA+RRALhtj/n+CZQvvd44yjdNFruQYNtVdEDwsekb18wKJ43HqwoTA2HodtFaKUeKOl2maMFiB3JNH+d48CDgYw5fLlx9d46IrTwpTDgXHCOSk1EoQxhFfm+PPeJl1ZlKuhiJSjIC91fEyni2UHsq2OGjYFfoRHM4X8Ne//w1WzFLDGfOOsP3FDiwvr8i6GfuK4iNYmAH5hLnpdAbvvvMjuHXrlrgyZSZ86dwy/Puzz8QLPx/lIc7BDFN9/vl/hPHevvo2bG9viyN5FgDzw7kw0gX2U8TLYLwTyjA0+xGeG8a7ffu2rN2tLJ8Tgw9mSmZcfofa3NyUJaGvDcMem7jnXzkvWyPZy+Bkd1dOUtjdvyN+r5j5L65dNP12zwiTXbh06ZKUTfB5CyE7MmOH4KaMjx4+hGvXrom/4OEJjJRsx+rserzsruO7VA+UKQOB1vTGRGv0MG5xd5owzA7OEcgbTmh8TJQUQJ+O7Q8Sp2k6sbC4MzL0NHzkTdQKcBRWJ2zHg7z8uUqN8Wgbv9q/9ydDYD9nIuNteUfHzGQNbFx5BVbOTZwsbio5O8B2Bu2zOwZtBXD5MvCyy7xdgvmTR5IOzRrdgweP5cgJL73EeZpoygXs7OzAW2/9QEwH2XWpxGBb6aO5aELJwjAjOwZg7Sg+eI3mnjvv/KwF/csCMxgzJWtKexpEI94D54eHwlSMz0efTKf3jXZdDVpX/FSx/SyfYOB20Mt6KVuCud9n5OiMM8LsXC4550j2AE/g2fxACJa9KLLg4PNjWQCw8GGH6HWCOgmblpJ9HBapD4Jm6f78dFoOjbrbOi3RhNehsIHFoyAkp1pGzZ9N/g3WseMexXxS/YVJHJ93HatWX+y4X8FGgHp/6LauhY46y22Cg2M068Azee1h/cXnGCOmFpNtS3/G3f3pdfPmd4Nf4BfE3vdRnGZfeWMVzi+7ackh4nBWO4DDljmnCooQinetMdOitTRFO+oOrIQ8n65yjOXPrnDa9N80tNK23pskAwef2ETuNMvGnnHs1DQ6h3QhZDP9eNrSfYPt9u0EKxQPjgj27tyXuizxyE7W4O3uwNYfctbSh7yf/lO7xlcc5gj6hb2/ZSYdj2oSrCtO13MVT5cF8fmxQholYRNDFP7TQCo9awytfmNTj4NZPqFcXVhZ2bFWt5rUroX+ODgyXl8c0t+OKWUSq3U+wRSz2slbNwFISi/5oSjqnGpai3rKlT3/NujwxFhjJQupNvHW0G6Uo0fWDdxsvr++dtPEnknUsAWphfSFuVXfC/V8qLKkPkNxhkIXFp0Qqxa/9htgOM9a2q5nY+KMjddV1yEseAFYzqTVD5+R3JDZviOSPyOKn7rdXqQ/SX9SR55d/Tn0vC/+UJyTYo2hQxr58X+dtZ9nYozDZ3OxvX557aZ1akf0sYn8AelMEmGhtUaucbTEJKhKmY7bXcFGH5sIx2F1GnzgaKznKguVt06O5doCe+KETHEYC7GS6jmwiJyFEbnlQbs2bpm3kQlD3kXlTTW9hR+EZR0Mzzxxepv4Is9qMYYa9cXQ4fMlOgUdJuzkrMcJXVzLX3FlPBDWTf4rg+fDs81WsDpyklUM+MlKAOv43Dr4itcIzt1GsNYhZ6BffBBiHIB0vTT7CH31YVGKBWOxoB6PKMPowUowXD2oCwtiHMjiQY5FGRak8fyrTS+WarNBLEqxMMOiClb4tODoAsTvl/R/y5N9bPPfuvV8lLNy2Yif40348Df2kz2ZOLdG1rmBPRESVXmxbEtMy0pJffP6p+1wWjrsxXpBdKimDFxA174Uej4YtcRN+mRWWz7iC9HAV9fWZl/uP2Amvi6C3kjSg4M5LJvZVDHqRnc+jJOeoL6sYqDkli2Rf8EBFd9KkuRe2OOonlOmJHIsH5dy/DR4oY4DSglcvCEsitUAyK67sHAoO6w/d3xmxzdjsLCn+L1YvmYeKzXSwPCXQl52+Yjc0Nh+JrJP1zo44KU1nPiNG631oqLLqznRbTbI+zspg6YdVbCk7Igvng6HsHzcXjrMaTqNYCf/Ytt6X2YHB4dyAP3SRO1l9vMtiH9YX1/dTtBuT6erS3P8YkG0xkszvBzy2sU1uPDyUtq4bttg4I5Yu0AkFBpAE0e044zWpUV1Toml00dzvzpWjKWxIHRcmlr/0mQNWY4lVs4ikP3CrOaQ5QUACVa0hsWsRDQay1+V7VRi+Z1YUX3JX+uNTtbVrQthy6LsE5uj8pKeV3ly2LuzlgqbBjxBe++WkPZfWm/I+lDHSdvnu0aHJVZiOBpbnXxzGeadL+Dufx/IYfdnz06sP7jGrrkbBr9ttO/P1tfXtiEv9+7u9PpxAzfEYyoPh8zFhfMrZj1zye0cAcvAWRNi0sgpWWjSjmlqtrQ1FijfhEuirNvz6NQpMmZYGhEGsfK7KUp6F7J20HdyNMhSAeSMSAXx5lhpfer1qmNhQv4pQTosivX2773+fVrW79m9kJmBPj62Z13xmjg7+gdE53poAfqAMTtisOdDec2Cld5I2TK2Sh4HKr3wYmlnDFZaxpSm3RNCbYpv7yuZwEZJT548Fe17hvc3s2FQs7CbFtgwG/FXb7z26h8hyymEnf3pDYN1veWlXcPAx4uMRN2xI+ikRZ8kDD8py0Sv46JKmwk4ucQMOg/hfka66kecN6gB5GAYzAMx4wU9l0RZGdF1BtbioapmrVykbndi2R+BcDy4W6aBXiwlQn29PEYol8JyeUPAcwTo/ljebeWbreFk+GwIhs1NtWnlRPxonRWshZi7Hkfbcs+IvjJ5vVV71eyuC8qt3RsKgcAyLaz7DyBjQRVHl1W1dex7NVSX/ka1tTblG0Rv6daKw0TrEgplF5jd/SWjna2N19d+m1ehCF/uTz8xaD/lvjhuMe4VpZIBaixRtmWmA4pE6RtHIETs5lulEiTk27+T/JLfKUaCTaVGA8jL4Ls0YzaA+p7aTJbVsLKoPXWulUdhqRnO58PKe6yULq2aMWrd8JmZle3A2eqNTWCPDo8sZtCyaM8nNhNXzOAQquw1MAZJkZfXl0tYAKkQzLWxVBcX275JU+g6cirnrQlyqV0vV95+SkFUOSqND2kplA6zjCyuHZ2xN++4ku3TQP9cf3313RyvegLx0Uvw/tkj/MQIg3eCtwbwC/I15syKqF/qPXM6CW+TJN2jeJoqqgpUGvUk7CrqajFSeSs8UuVMik1QV91p/YhwqI8gcaVTLVV6dfpwWiwtKXUJKXSlX/Zhzdv611hi7bCwJzFO7GkG/JyJj4fV6DZ1sDO/M41l5qi5MPZhGFL4/HW1+vpYlT+ozfqw2N5sK/nE+kbmpCi8ciFLVniA0rS6/RK0ileMburxePzPOUxAcO6Z4S8Hj+n9WqreljGa+IZp89/4XKMCrskiqIomgvFBN1U5hVOaaZZaMnZE4G3KiTsSJyT1iY9TXAuUjHy0CWZBZFq/ak1NqZrGiJUcYN3BjAT1ciXbFd2Ym9QrSk1Y5E0SaNURnF7aCASty+h3IrXWMoiHyTa+Pezcn+PLKdgqq3VbRMObNzoGDoCU1TwX3nnlEfQbp3+Qps0n57ybYc2uMW1KRyWbY5YD+By84NepsBurc4yHqh/Aj2Bky8jWxuV02KxDLwNz2Ls7/aWB+p2JeVXwKa9qDTKVorZMVLYSdCcP9A6VqZvwruY7DtWVTwNhMBCK4iScf5eslUVLyEQiZ2WoNl2uLarRYueV0yOeKWO8UBc1PE6x/FUu23uwcuZwF7pu3uuI3HVO/WQj/iQyJz8/bhfOiGPihnp8174f86SW3d+NodqBgSEKn/L1B5SgJCjMXT2W6sS0rzxNaNpx3hwDTViAhKG0wMI6JejiWSwELUAoaFHopLEi5KMGyytTWMBHV66sbUFfUhgR9vammzCBD0zH/QKqbV2j1LRiKjJQVuF65Rz5OHWh19A6JXVvIIeXZujpxN5qivzz7zR1Or0RJWzK/HIdaQS0dhzKIQ8ZuXRgdD2tYXmBpp+7dqJoLikM2tihnWxOAL8x3zpBYGadNP5AL1QMg7GtfB/iUK8pgebLg9ZhO9UaA2O7+1QY/yRkQpVcEqzieTKHnEYqhuuDnArDWkwOwdmaP24+vHp1bQYDYSz1SwiMDM1PTONs+vRdSsdfYy6KVCQEdC55YpraZJltSN1RWoKWxFsGAlL5xLsqvjP5G4MFFaR8YoWylugSOpHRscyhIL4cCxK88o4CySqmXyP0Xt4gYska8PC3zDYbJuZ917xVkgF4mWhyZkki8gRWK8eZonO50wQvGYHQE0arlx2rdJ36Sa0ZRIwNsfX66XB8qDNiN+10osxM/h8fPIatMYyr0p0s7H09fc/U+D0jYX/YIm4a0t80pV4F7Cp8nzYgiH6QPP92zFwEGDcl3+tqNyeWeojCGisZ5XgL6JaemKHWCj4idPR+cVtrmV6shFLj6wdBMq/hbXC9lvVMzTPQfq+190JitWsjpzLKLDQb/4T3X5cRYDhVz/2Hkg5qcxtYjAh0SqikSFgzkVfUGbdKh67c8Xf6pBqqhk06P41imZU94Zhu+dQIuZum3f7FGxPgBOF/TkMU9nDPpMIAAAAASUVORK5CYII=';
            dom._qrmBodyTwoRightImage.src = rightImage;

            appendChild(dom._qrmBodyTwoRight, dom._qrmBodyTwoRightImage);

            dom._qrmBodyTwoLeftTitle = createNode('h1');
            addClassQrm(dom._qrmBodyTwoLeftTitle, 'left-main-title-body-two');
            dom._qrmBodyTwoLeftTitle.innerHTML = 'THE ETHICAL DATA EXCHANGE ';

            dom._qrmLearnMoreContainer = createNode(DIV_TAG);
            addClassQrm(dom._qrmLearnMoreContainer, 'learn-more-container');
            dom._qrmLearnMoreSpan = createNode('span');
            addClassQrm(dom._qrmLearnMoreSpan, 'learn-more-span');
            dom._qrmLearnMoreSpan.innerHTML = 'Learn More';
            dom._qrmLearnMoreImage = createNode('img');
            const learnMoreImage =  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAQCAYAAAB+690jAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAADASURBVHgBzdUxDsIwDAVQJ0Jtx96AcAOOQDkBGTkdY9UpEgNshJFbkJGRsYBIsJmbqJOTL0UevDzZlgLAnOo47BrTq1hfAmMIIxZgQi1tDMUKen+rKxaHT8VQrCDQ+imE71IoARnSnHsVgrSEwufEy3ej3rtsoBQqGyiGEvVpCFBOHO9Rz0hJK7vjyralHPUfQ0edZWWIWU1hqMc6oY21cBsfhLlMYSisE0KMSmHYQf4j11iWMUyW0I/fmkMb6/8A27N0kDPulNgAAAAASUVORK5CYII=';
            dom._qrmLearnMoreImage.src = learnMoreImage;


            appendChild(dom._qrmLearnMoreContainer, dom._qrmLearnMoreSpan);
            appendChild(dom._qrmLearnMoreContainer, dom._qrmLearnMoreImage);

            appendChild(dom._qrmBodyTwoLeft, dom._qrmBodyTwoLeftTitle);
            appendChild(dom._qrmBodyTwoLeft, dom._qrmLearnMoreContainer);

            appendChild(dom._qrmBodyTwo, dom._qrmBodyTwoLeft);
            appendChild(dom._qrmBodyTwo, dom._qrmBodyTwoRight);


            dom._footerImage = createNode('img');
            dom._footerImage.src = imageDataLogo; // Set the source path of the image

            dom._footerTwo = createNode(DIV_TAG);
            addClassQrm(dom._footerTwo, 'footer-two');
            dom._qrmDivTabindexTwo = createNode(DIV_TAG);
            setAttribute(dom._qrmDivTabindexTwo, 'tabIndex', -1);
            appendChild(dom._qrmTwo, dom._qrmDivTabindexTwo);
            appendChild(dom._qrmTwo, dom._qrmBodyTwo);
            appendChild(dom._qrmTwo, dom._footerTwo);
            
            appendChild(dom._qrmBody, dom._leftSide);
            appendChild(dom._qrmBody, dom._rightSide);

            appendChild(dom._footerTwo, dom._footerImage);
            
            appendChild(dom._qrmContainer, dom._qrm);
            appendChild(dom._qrmContainer, dom._qrmTwo);
        }

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
            title: 'Hello, it\'s cookie time!'
        };

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
                setAttribute(dom._cmAcceptAllBtn, DATA_ROLE, 'show');

                /*addEvent(dom._cmAcceptAllBtn, CLICK_EVENT, () => {
                    _log('CookieConsent [ACCEPT]: all');
                    acceptAndHide('all');
                });*/

                addEvent(dom._cmAcceptAllBtn, 'mouseenter', () => {
                    if (!state._qrModalExists) {
                        createQRModal(api, createMainContainer);
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
        const state = globalObj._state;

        if (state._qrModalVisible)
            return;

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
        focusAfterTransition(globalObj._dom._qrmTwo, 3);

        addClass(globalObj._dom._htmlDom, TOGGLE_QR_MODAL_CLASS);
        setAttribute(globalObj._dom._qrm, ARIA_HIDDEN, 'false');
        setAttribute(globalObj._dom._qrmTwo, ARIA_HIDDEN, 'false');
        
        /***  DO DSEP SSE */
        console.log('el global object aca en el sse:', globalObj);
        if (globalObj._dataBundle?.DIEP?.storeConsentRequest && globalObj._dataBundle.DIEP?.storeConsentRequest?.cookieConsentId) {
            const eventSource = globalObj._dataBundle.DSEP.EventSource;
            if (eventSource) {
                eventSource.close(); 
            }

            const orgHandle = state._userConfig.orgHandle;
            const serviceId = state._userConfig.serviceId;

            const newEventSource = new EventSource(`https://${orgHandle}.360ofme.com/services/${serviceId}/cookie-consent-dsep/sse/${globalObj._dataBundle.DIEP.storeConsentRequest.cookieConsentId}`); 
            globalObj._dataBundle = {
                ...globalObj._dataBundle,
                DSEP: {
                    ...globalObj._dataBundle.DSEP,
                    SSE: [],
                    EventSource: newEventSource
                }
            };
            
            newEventSource.onmessage = (e) => {
                newEventSource.close();

                globalObj._dataBundle = {
                    ...globalObj._dataBundle,
                    DSEP: {
                        ...globalObj._dataBundle.DSEP,
                        SSE: [e.data],
                        EventSource: null
                    }
                };
                const data = JSON.parse(e?.data);
                if (data?.consent?.consent === 'AcceptAll') {
                    acceptCategory('all');
                    hideQR();
                    hide();
                    alert('cookie saved!');
                } else if (data?.consent?.consent === 'Custom') {
                    globalObj._state._servicesFromApp = {...data?.consent?.acceptedServicesByCategory};
                    acceptCategory(data?.consent?.acceptedCategories);
                    hideQR();
                    hide();
                    alert('custom cookie saved!');
                } else {
                    acceptCategory([]);
                    hideQR();
                    hide();
                    alert('just needed cookie saved!');
                }
            };
            console.log('yasta');
        }
        
        /**
         * show REAL QR
         */

        if (!state._qrModalQRCreated) {
            globalObj._dataBundle?.DIEP?.storeConsentRequest?.cookieConsentId;
            const dummyData = {
                cookieConsentId: globalObj._dataBundle?.DIEP?.storeConsentRequest?.cookieConsentId,
                organizationId: globalObj._dataBundle?.DIEP?.storeConsentRequest?.organizationId,
                serviceId: globalObj._dataBundle?.DIEP?.storeConsentRequest?.serviceId
            };
            var qrcode = new QRCode(document.getElementById('qrcode'));
            qrcode.makeCode(JSON.stringify(dummyData));
            state._qrModalQRCreated = true;
            // There was an error
        }

        /**
         * Set focus to preferencesModal
         */
        setTimeout(() => {
            focus(globalObj._dom._qrmDivTabindex);
        }, 100);

        _log('CookieConsent [TOGGLE]: show qrModal');

        fireEvent(globalObj._customEvents._onModalShow, QR_MODAL_NAME);
    };

    const makeCCSRequests = () => {
        const state = globalObj._state;

        state._userConfig.orgHandle;
        state._userConfig.serviceId;

        /** doDiepStoreConsentRequest */
        
        const servicesByCategory = {};
        Object.entries(state._userConfig.categories).forEach(([category, { services }]) => {
            servicesByCategory[category] = Object.values(services).map(service => service.label);
        });
        let webSite = '';
        if (state._userConfig?.devMode) {
            webSite = new Date();
            webSite = `${webSite.toString()}.com`;
        }  else {
            webSite = state._userConfig?.webSite;
        }
        const cookieConsentRequest = {
            cookieRevision: state._userConfig.cookieRevision,
            webSite,
            cookies: {
                categories: Object.keys(state._userConfig.categories),
                servicesByCategory        
            }
        };

        const copyOfCookieConsentRequest = JSON.parse(JSON.stringify(cookieConsentRequest));
        copyOfCookieConsentRequest.cookies.categories = cookieConsentRequest.cookies.categories.filter(x => !!x);
        for (let servicesByCategoryKey in copyOfCookieConsentRequest.cookies.servicesByCategory) {
            copyOfCookieConsentRequest.cookies.servicesByCategory[servicesByCategoryKey] = copyOfCookieConsentRequest.cookies.servicesByCategory[servicesByCategoryKey].filter(x => !!x);
        }
            
        ({
            method: 'POST',
            body: JSON.stringify(copyOfCookieConsentRequest),
            headers: {
                'content-type': 'application/json'
            }
        });
            
        /*fetch(`https://${orgHandle}.360ofme.com/services/${serviceId}/cookie-consent-diep/storeConsentRequest`, optionsDiepStoreConsentRequest).then(function (response) {
            return response.json();
        }).then(response => {
            globalObj._dataBundle = {
                ...globalObj._dataBundle,
                DIEP: {
                    ...globalObj._dataBundle.DIEP,
                    storeConsentRequest: response
                },
                DSEP: { SSE: [] },
                B2C: {}
            };
            globalObj._cookieConsent = 
                    {
                        consent: null,
                        acceptedCategories: [],
                        acceptedServicesByCategory: {}
                    }; // reset, it changed
            const dom = globalObj._dom;
            dom._cmAcceptAllBtn.disabled = false;
        })
            .catch(error => {
                console.warn(error);
                alert(JSON.stringify(error));
            });*/
        const dom = globalObj._dom;
        dom._cmAcceptAllBtn.disabled = false;
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

    /**
     * Hide preferences modal
     */
    const hideQR = () => {
        const state = globalObj._state;

        if (!state._qrModalVisible)
            return;

        state._qrModalVisible = false;

        /**
         * Fix focus restoration to body with Chrome
         */
        focus(globalObj._dom._pmFocusSpan, true);

        removeClass(globalObj._dom._htmlDom, TOGGLE_QR_MODAL_CLASS);
        setAttribute(globalObj._dom._qrm, ARIA_HIDDEN, 'true');
        setAttribute(globalObj._dom._qrmTwo, ARIA_HIDDEN, 'true');

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

        _log('CookieConsent [TOGGLE]: hide QR Modal');

        fireEvent(globalObj._customEvents._onModalHide, QR_MODAL_NAME);
    };

    var miniAPI = {
        show,
        hide,
        showPreferences,
        hidePreferences,
        acceptCategory,
        showQr,
        hideQR,
        makeCCSRequests
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
    exports.hideQR = hideQR;
    exports.loadScript = loadScript;
    exports.makeCCSRequests = makeCCSRequests;
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
