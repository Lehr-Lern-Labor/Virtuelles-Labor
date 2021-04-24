/**
 * The Emoji Picker View
 * 
 * @author Eric Ritte, Klaudia Leo, Laura Traub, Niklas Schmidt, Philipp Schumacher
 * @version 1.0.0
 */
class EmojiPicker extends Views {

    /**
     * Creates an instance of emoji picker
     */
    constructor() {
        super();

        if (!!EmojiPicker.instance) {
            return EmojiPicker.instance;
        }

        EmojiPicker.instance = this;
    }

    /**
     * Draws emoji picker window
     * @param {String} emojiTriggerId id of the emoji trigger button
     * @param {String} emojiPickerId id of the emoji picker button
     * @param {String} inputId input field id
     */
    draw(emojiTriggerId, emojiPickerId, inputId) {
        $('#' + emojiTriggerId).off()
        $('#' + emojiTriggerId).on('click', (event) => {
            event.preventDefault();

            if ($('#' + emojiPickerId + 'Div').css('display') !== 'none') {
                $('#' + emojiPickerId + 'Div').hide()
            } else {
                $('#' + emojiPickerId + 'Div').show()

                document.getElementById(emojiPickerId).shadowRoot.querySelector('.search-row').setAttribute('style', 'display:none');
                document.getElementById(emojiPickerId).shadowRoot.querySelector('.favorites').setAttribute('style', 'display:none');
            }
        })

        $(document).on('mouseup', (e) => {
            const emojiPickerDiv = $('#' + emojiPickerId + 'Div');

            const descendants = [emojiPickerDiv, $('#' + inputId), $('#' + emojiTriggerId)]
            let isNotDescendant = true;

            descendants.forEach(descendant => {
                isNotDescendant &&= !descendant.is(e.target) && descendant.has(e.target).length === 0;
            })

            // if the target of the click isn't the container nor a descendant of the container
            if (isNotDescendant) {
                emojiPickerDiv.hide();
            }
        });

        document.getElementById(emojiPickerId).addEventListener('emoji-click', event => {
            this.insertAtCursor(document.getElementById(inputId), event.detail.unicode)
        }, false);
    }

    /**
     * insert value at current cursor
     * 
     * @param {Object} inputField input field
     * @param {String} valueToAdd value to add in the input field
     */
    insertAtCursor(inputField, valueToAdd) {
        //IE support
        if (document.selection) {
            inputField.focus();
            sel = document.selection.createRange();
            sel.text = valueToAdd;
        }
        // Microsoft Edge
        else if (window.navigator.userAgent.indexOf("Edge") > -1) {
            var startPos = inputField.selectionStart;
            var endPos = inputField.selectionEnd;

            inputField.value = inputField.value.substring(0, startPos) + valueToAdd
                + inputField.value.substring(endPos, inputField.value.length);
        }
        //MOZILLA and others
        else if (inputField.selectionStart || inputField.selectionStart == '0') {
            var startPos = inputField.selectionStart;
            var endPos = inputField.selectionEnd;
            inputField.value = inputField.value.substring(0, startPos)
                + valueToAdd
                + inputField.value.substring(endPos, inputField.value.length);
        } else {
            inputField.value += valueToAdd;
        }
        
        var pos = startPos + valueToAdd.length;
        inputField.focus();
        inputField.setSelectionRange(pos, pos);
    }
}