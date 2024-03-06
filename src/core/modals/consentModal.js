import { globalObj } from '../global';

import {
    _log,
    createNode,
    addClass,
    addClassCm,
    setAttribute,
    appendChild,
    addEvent,
    getModalFocusableData,
    addDataButtonListeners,
    getSvgIcon,
    handleFocusTrap,
    fireEvent
} from '../../utils/general';

import {
    CONSENT_MODAL_NAME,
    DIV_TAG,
    ARIA_HIDDEN,
    BUTTON_TAG,
    BTN_GROUP_CLASS,
    CLICK_EVENT,
    DATA_ROLE
} from '../../utils/constants';

import { guiManager } from '../../utils/gui-manager';
import { createPreferencesModal } from './preferencesModal';
import { createQRModal }  from './qrModal';

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
export const createConsentModal = (api, createMainContainer) => {
    const state = globalObj._state;
    const dom = globalObj._dom;
    const {hide, showPreferences, acceptCategory, showQr} = api;

    /**
     * @type {import("../global").ConsentModalOptions}
     */
    const consentModalData = {
        acceptAllBtn: 'Accept All',
        acceptNecessaryBtn: 'Just neccesary',
        description: 'This website uses cookies. Cookies are pieces of text set by the website and stored in your browser, which are sent every time you access the website or a potential third party website. They are important for your privacy because they remember sensitive information about you can can be used to track your behavior and preferences. Click here to learn more about how 360ofme can protect your privacy.',
        showPreferencesBtn: 'Custom',
        title: 'Manage Your Cookies Consent'
    };

    const acceptAllBtnData = consentModalData.acceptAllBtn,
        acceptNecessaryBtnData = consentModalData.acceptNecessaryBtn,
        showPreferencesBtnData = consentModalData.showPreferencesBtn,
        closeIconLabelData = consentModalData.closeIconLabel,
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
        else if (consentModalTitleValue)
            setAttribute(dom._cm, 'aria-labelledby', 'cm__title');

        const
            boxLayout = 'box',
            guiOptions = state._userConfig.guiOptions,
            consentModalOptions = guiOptions && guiOptions.consentModal,
            consentModalLayout = consentModalOptions && consentModalOptions.layout || boxLayout,
            isBoxLayout = consentModalLayout.split(' ')[0] === boxLayout;

        /**
         * Close icon-button (visible only in the 'box' layout)
         */
        if (consentModalTitleValue && closeIconLabelData && isBoxLayout) {
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

        if (acceptAllBtnData || acceptNecessaryBtnData || showPreferencesBtnData)
            appendChild(dom._cmBody, dom._cmBtns);

        dom._cmDivTabindex = createNode(DIV_TAG);
        setAttribute(dom._cmDivTabindex, 'tabIndex', -1);
        appendChild(dom._cm, dom._cmDivTabindex);

        appendChild(dom._cm, dom._cmBody);
        appendChild(dom._cmContainer, dom._cm);
    }

    if (consentModalTitleValue) {
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

    if (!dom._cmUse360Btn) {
        dom._cmUse360Btn = createNode(BUTTON_TAG);
        appendChild(dom._cmUse360Btn, createFocusSpan());
        addClassCm(dom._cmUse360Btn, 'btn');
        addClassCm(dom._cmUse360Btn, 'btn-360');
        setAttribute(dom._cmUse360Btn, DATA_ROLE, 'show');

        addEvent(dom._cmUse360Btn, 'mouseenter', () => {
            if (!state._qrModalExists) {
                createQRModal(api, createMainContainer);
            }
        });
        addEvent(dom._cmUse360Btn, CLICK_EVENT, showQr);
    }

    dom._cmUse360Btn.firstElementChild.innerHTML = 'Manage with';

    if (acceptAllBtnData) {
        if (!dom._cmAcceptAllBtn) {
            dom._cmAcceptAllBtn = createNode(BUTTON_TAG);
            appendChild(dom._cmAcceptAllBtn, createFocusSpan());
            addClassCm(dom._cmAcceptAllBtn, 'btn');
            setAttribute(dom._cmAcceptAllBtn, DATA_ROLE, 'show');

            addEvent(dom._cmAcceptAllBtn, CLICK_EVENT, () => {
                _log('CookieConsent [ACCEPT]: all');
                acceptAndHide('all');
            });
        }

        dom._cmAcceptAllBtn.firstElementChild.innerHTML = acceptAllBtnData;
    }

    if (acceptNecessaryBtnData) {
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

    if (showPreferencesBtnData) {
        if (!dom._cmShowPreferencesBtn) {
            dom._cmShowPreferencesBtn = createNode(BUTTON_TAG);
            appendChild(dom._cmShowPreferencesBtn, createFocusSpan());
            addClassCm(dom._cmShowPreferencesBtn, 'btn');
            setAttribute(dom._cmShowPreferencesBtn, DATA_ROLE, 'show');

            addEvent(dom._cmShowPreferencesBtn, 'mouseenter', () => {
                if (!state._preferencesModalExists)
                    createPreferencesModal(api, createMainContainer);
            });
            addEvent(dom._cmShowPreferencesBtn, CLICK_EVENT, showPreferences);
        }

        dom._cmShowPreferencesBtn.firstElementChild.innerHTML = showPreferencesBtnData;
    }


    acceptAllBtnData && appendChild(dom._cmBtns, dom._cmAcceptAllBtn);
    acceptNecessaryBtnData && appendChild(dom._cmBtns, dom._cmAcceptNecessaryBtn);

    if (dom._cmShowPreferencesBtn) {
        appendChild(dom._cmBtns, dom._cmShowPreferencesBtn);
    }
    appendChild(dom._cmBtns, dom._cmUse360Btn);


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