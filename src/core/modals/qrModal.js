import { globalObj } from '../global';

import {
    _log,
    createNode,
    addClass,
    addId,
    addClassQrm,
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
    QR_MODAL_NAME,
    DIV_TAG,
    ARIA_HIDDEN,
    BUTTON_TAG,
    CLICK_EVENT
} from '../../utils/constants';

import { guiManager } from '../../utils/gui-manager';
import { createPreferencesModal } from './preferencesModal';

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
export const createQRModal = (api, createMainContainer) => {
    const state = globalObj._state;
    const dom = globalObj._dom;
    const {hide, hideQR} = api;
    const consentModalTitleValue = 'Scan QR';
    /**
     * @type {import("../global").PreferencesModalOptions}
     */
    const modalData = state._currentTranslation && state._currentTranslation.preferencesModal;
    const titleData = 'Scan this code with your 360 app';

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

        dom._qrmHeader = createNode(DIV_TAG);
        addClassQrm(dom._qrmHeader, 'header');

        dom._qrmTitle = createNode('h2');
        addClassQrm(dom._qrmTitle, 'title');
        dom._qrmTitle.id = 'qrm__title';

        dom._qrmCloseBtn = createNode(BUTTON_TAG);
        addClassQrm(dom._qrmCloseBtn, 'close-btn');
        setAttribute(dom._qrmCloseBtn, 'aria-label', modalData.closeIconLabel || '');
        addEvent(dom._qrmCloseBtn, CLICK_EVENT, hideQR);

        dom._qrmFocusSpan = createNode('span');
        dom._qrmFocusSpan.innerHTML = getSvgIcon();
        appendChild(dom._qrmCloseBtn, dom._qrmFocusSpan);

        appendChild(dom._qrmHeader, dom._qrmTitle);
        appendChild(dom._qrmHeader, dom._qrmCloseBtn);

        if (titleData) {
            dom._qrmTitle.innerHTML = titleData;
            modalData.closeIconLabel && setAttribute(dom._qrmCloseBtn, 'aria-label', modalData.closeIconLabel);
        }

        const
            boxLayout = 'box',
            guiOptions = state._userConfig.guiOptions,
            consentModalOptions = guiOptions && guiOptions.consentModal,
            consentModalLayout = consentModalOptions && consentModalOptions.layout || boxLayout,
            isBoxLayout = consentModalLayout.split(' ')[0] === boxLayout;

        dom._qrmBody = createNode(DIV_TAG);
        addClassQrm(dom._qrmBody, 'body');
        addId(dom._qrmBody, 'qrcode');

        dom._qrmDivTabindex = createNode(DIV_TAG);
        setAttribute(dom._qrmDivTabindex, 'tabIndex', -1);
        appendChild(dom._qrm, dom._qrmDivTabindex);
        appendChild(dom._qrm, dom._qrmHeader);
        appendChild(dom._qrm, dom._qrmBody);
        appendChild(dom._qrmContainer, dom._qrm);
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