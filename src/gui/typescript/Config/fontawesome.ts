import { library } from "@fortawesome/fontawesome-svg-core";
/* import font awesome icon component */
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";


/**
 * Alle Icons müssen hier geladen 
 * und dann per library.add() hinzugefügt werden
 */
import { faSliders, faCloudArrowUp, faGripLines, faRepeat, faPlay, faFileExport, faRotate, faUndo, faPlus, faTrash, faFloppyDisk, faCaretDown, faCaretUp, faEllipsisVertical, faMagnifyingGlass, faPen } from "@fortawesome/free-solid-svg-icons";

library.add(faSliders, faCloudArrowUp, faGripLines, faRepeat, faPlay, faFileExport, faRotate, faUndo, faPlus, faTrash, faFloppyDisk, faCaretDown, faCaretUp, faEllipsisVertical, faMagnifyingGlass, faPen);


/** 
 * Bitte wie folgt einbinden 
 * 
 * Vue.component('font-awesome-icon', FontAwesomeIcon)
 */
export default FontAwesomeIcon;