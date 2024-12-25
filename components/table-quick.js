/**
 * table-quick: Componente Vue para tablas, permite:
 * ordenar, filtro simple y avanzado, selección múltiple
 * contenido extra, personalización del contenido
 * selección de columnas visibles y más.
 * Optimizado para velocidad.
 *
 * @author miloter
 * @since 2024-05-11
 * @version 2024-12-25
 *
 * Ordenación y filtrado: se realiza únicamente en las filas que pertenecen
 * al cuerpo de la tabla, excluyendo la fila de cabecera y las del pie.
 * Ordenación: el primer click ordena ascendentemente, el segundo descendentemente y el
 * tercero restaura el estado original, el ciclo se repite en el mismo orden.
 * Filtrado: no se distingue entre mayúscuas y minúsculas ni los
 * caracteres acentuados o con signos diacríticos. Si marcamos el check de
 * expresiones regulares se habilita dicho sistema de búsqueda.
 *
 * props:
 *      headers: array de objetos con los nombres de las cabeceras y las claves.
 *      El formato será {
 *          title: '...',
 *          key: '...',
 *          showFilter: true|false
 *      }, donde title es el título descriptivo de la cabecera, key el nombre de
 *      la clave en el objeto de la fila, showFilter indica si se mostrará o no
 *      un campo de filtrado.
 *      El array headers debe ser de carga síncrona, en otras palabras, lo define
 *      el programador en tiempo de diseño.
 *  
 *      rows: array de objetos con los datos de las filas. Puede ser
 *      de carga asíncrona.
 *
 *      rowsPerPage: Número de filas que se mostrarán en cada página
 *      por defecto serán 10.
 *
 *      rowsSelectPage: Array de número de filas por página, por
 *      defecto es [2, 5, 10, 20, 50].
 *
 *      columnsMultiSelect: booleano que indica si se muestra o no
 *      un cuadro de selección de columnas visibles.
 *
 *      csvExport: booleano que indica si se muestra o no un botón
 *      de exportación a archivo CSV, por defecto es true.
 *
 *      controlsPagination: booleano que indica si se muestran o no
 *      los controles de paginación, por defecto es true.
 *
 * emits:
 *      filterChanged(currentRows): Cuando se produce un cambio en la ordenación o
 *      filtrado de las filas, recibe como argumento las filas filtradas.
 *  
 *      paginatedChanged(paginatedRows): Cuando cambia la página visualizada
 *      el argumento son las filas visibles.
 *
 *      selectedChanged(selectedRows): cuando se produce un cambio en las filas
 *      seleccionadas, el argumento son las filas seleccionadas.
 */
app.component('table-quick', {
    props: {
        headers: Array,
        rows: Array,
        rowsPerPage: { type: Number, default: 10 },
        rowsSelectPage: { type: Array, default: () => [2, 5, 10, 20, 50] },
        columnsMultiSelect: { type: Boolean, default: true },
        csvExport: { type: Boolean, default: true },
        controlsPagination: { type: Boolean, default: true },
        multiselect: { type: Boolean, default: false }
    },
    emits: ['filterChanged', 'paginatedChanged', 'selectedChanged'],
    template: /*html*/`
        <div :class="componentUid">
            <div class="top-controls">                  
                <button v-if="appliedFilters" type="button"
                    @click="filters_unapply" class="filters-unapply"
                    title="Desaplica todos los filtros existentes">
                    &#x1F704;
                </button>                
                <div>{{ currentRows.length }} filas de {{ rows.length}}</div>
                <a v-if="csvExport" href="#" @click="download_csv" title="Exporta el filtrado actual a un archivo CSV">CSV</a>
                <div v-if="columnsMultiSelect" class="columns-multiselect">                        
                    <button type="button" @click="columnsSelectDisplayed = !columnsSelectDisplayed">
                        Mostrar/ocultar columnas
                    </button>                            
                    <div v-show="columnsSelectDisplayed" class="columns-multiselect-checkboxes">
                        <label class="columns-multiselect-label-main">
                            <input type="checkbox"
                                :checked="selectedColumns.length === headers.length"
                                @click="columnsSelecChange($event.target.checked, null)">
                            - Todas Visibles -
                        </label><br>                
                        <template v-for="col in headers" :key="col.key">
                            <label>
                                <input type="checkbox" :checked="col.checked"
                                    @click="columnsSelecChange($event.target.checked, col)">
                                {{ col.title }}
                            </label><br>
                        </template>
                    </div>
                </div>
                <slot name="customControls"></slot>
            </div>
            <table class="table">
                <thead>
                    <tr>
                        <th v-if="multiselect">
                            <input type="checkbox" :checked="selectedRowsEqualsRows" @click="changeChecked($event.target.checked, null)">
                            <button type="button" title="Solo filtrados"
                                @click="filterSelected = !filterSelected"
                                :class="{ 'filter-advanced': filterSelected }">
                                &#x2611;
                            </button>
                        </th>  
                        <th v-if="$slots.extra">&nbsp;</th>                            
                        <th v-for="(h, idx) of selectedColumns" :key="idx">                
                            <div v-if="h.showFilter" class="filter-controls">
                                <span :title="sortTitle" class="sort" @click="sortOrFilter(true, h.key)">&udarr;</span>
                                <input type="text" class="input-filter"
                                    :title="filterTitle" v-model.trim="hFilter[idx].text"
                                    @keyup="sortOrFilter(false, h.key)">                                
                                <button type="button" @click="modal_show(idx)"
                                    :class="{ 'filter-advanced': hFilter[idx].isRegExp }"
                                    title="Muestra el filtro avanzado">&#x2699;</button>
                            </div>                                          
                            {{ h.title }}
                        </th>                        
                    </tr>
                </thead>
                <tbody>
                    <template v-for="(r, idx) of paginated" :key="idx">
                        <tr>
                            <td v-if="multiselect">
                                <input type="checkbox" :checked="r.checked" @click="changeChecked($event.target.checked, r)">
                            </td>
                            <td v-if="$slots.extra">
                                <a href="#" @click.prevent="expandChange(r)" style="text-decoration: none;">
                                    {{ r.expand ? '∨': '>' }}                                    
                                </a>
                            </td>
                            <template v-for="h of selectedColumns" :key="h.key">                            
                                <td v-if="$slots[h.key]">                                
                                    <slot :name="h.key" :row="r"></slot>
                                </td>
                                <td v-else>
                                    {{ r[h.key] }}
                                </td>
                            </template>
                        </tr>
                        <tr v-if="$slots.extra && r.expand">
                            <td :colspan="(multiselect ? 2 : 1) + headers.length">
                                <slot name="extra" :row="r"></slot>
                            </td>
                        </tr>
                    </template>
                </tbody>            
            </table>
            <div v-show="controlsPagination"
                class="paginator-controls">
                <button type="button" @click="prevPage">&#9664;</button>
                Página <input type="number" :min="1" :max="numPages"
                        v-model="currentPage"
                        @keyup.enter="currentPage_enter">  de {{ numPages }}
                <button type="button" @click="nextPage">&#9654;</button>  
                <label>
                    Filas/Página
                    <select v-model="rowsPerPage" @change="setNumPages">
                        <option v-for="rp in rowsSelectPage" :key="rp" :value="rp">{{ rp }}</option>
                    </select>
                </label>        
            </div>
            <dialog v-if="hFilter.length > 0"  ref="modal" class="dialog-modal">
                <h3 class="dialog-modal-title">Filtro avanzado [{{ headers[filterAdvancedIdx].title }}]</h3>                
                <form method="dialog" @submit="modal_apply_close">
                    <div class="dialog-header">                        
                        <select v-model="hFilter[filterAdvancedIdx].regExpType"
                            title="Seleccione el tipo de filtro">
                            <option v-for="opt of filterAdvancedOptions"
                                :key="opt.value" :value="opt.value" :selected="opt.value === hFilter[filterAdvancedIdx].regExpType">
                                {{ opt.text }}
                            </option>
                        </select>
                        <button type="button" @click="modal_apply"
                            title="Aplica el filtro y mantiene abierto el diálogo">Aplicar</button>
                        <button type="button" @click="filter_advanced_field_add"
                            title="Agrega un nuevo campo de filtro">&#x2b;</button>                        
                    </div>
                    <div class="dialog-body">
                        <div v-for="(field, idx) of hFilter[filterAdvancedIdx].regExpFields" :key="idx">
                            <input type="text" v-model="hFilter[filterAdvancedIdx].regExpFields[idx]"
                                title="Escriba aquí el texto para este filtro"
                                @keydown.prevent.enter="modal_apply">                            
                            <button type="button" @click="filter_advanced_field_sub(idx)"
                                title="Elimina este campo del filtro"                
                                :disabled="idx === 0">&#x2d;</button>
                            <span> O </span>
                        </div>
                    </div>
                    <div class="dialog-footer">
                        <button type="submit"
                            title="Aplica el filtro y cierra el diálogo">Aplicar y cerrar</button>
          .              <button type="button"
                            title="Cierra el diálogo" @click="modal_close">Cerrar</button>
                        <button type="button" title="Desaplica el filtro y cierra el diálogo"
                            @click="modal_unapply_close">Desaplicar y Cerrar</button>
                    </div>
                </form>
            </dialog>
        </div>
    `,
    data() {
        return {
            hFilter: [],
            currentRows: [],
            unorderedRows: [],
            asc: undefined,
            currentPage: 1,
            numPages: undefined,
            paginated: [],
            filterAdvancedOptions: [{
                value: 'cont',
                text: 'Que contenga'
            }, {
                value: 'ncont',
                text: 'Que no contenga'
            }, {
                value: 'match',
                text: 'Que coincida con'
            }, {
                value: 'nmatch',
                text: 'Que no coincida con'
            }, {
                value: 'start',
                text: 'Que comienze con'
            }, {
                value: 'nstart',
                text: 'Que no comienze con'
            }, {
                value: 'end',
                text: 'Que termine con'
            }, {
                value: 'nend',
                text: 'Que no termine con'
            }],
            filterAdvancedIdx: 0,
            selectedRows: [],            
            selectedColumns: [],
            columnsSelectDisplayed: false,
            filterSelected: false
        }
    },
    methods: {               
        columnsSelecChange(value, col) {
            if (col) {
                col.checked = value;
                if (value) {
                    this.selectedColumns.push(col);
                } else {
                    this.selectedColumns = this.selectedColumns.filter(c => c !== col);
                }
            } else {
                for (let col of this.headers) {
                    col.checked = value;
                }
                this.selectedColumns = value ? this.headers : [];
            }
            this.updateHeaderFilters();
        },
        clickOutside(e) {
            if (!this.columnsSelectDisplayed) return;

            // Se comprueba que no exista en ningún elemento contenedor
            // la clase:
            const className = 'columns-multiselect';
            let el = e.target;
            let exists = false;
            while (el !== null) {
                if (el.classList.contains(className)) {
                    exists = true;
                    break;
                }
                el = el.parentElement;
            }

            if (!exists) {
                this.columnsSelectDisplayed = false;
            }
        },
        expandChange(row) {
            row.expand = !row.expand;
        },
        changeChecked(value, row) {
            if (row) {
                row.checked = value;
                if (value) {
                    this.selectedRows.push(row);
                } else {
                    this.selectedRows = this.selectedRows.filter(r => r !== row);
                }
            } else {
                for (let row of this.currentRows) {
                    row.checked = value;
                }
                this.selectedRows = value ? this.currentRows : [];
            }
            this.$emit('selectedChanged', this.selectedRows);
        },
        modal_show(idx) {
            this.filterAdvancedIdx = idx;
            this.$refs.modal.showModal();
        },
        modal_apply_close() {
            this.modal_apply();
        },
        modal_apply() {
            const filter = this.hFilter[this.filterAdvancedIdx];
            filter.text = this.getPatternOfFields(filter);
            filter.isRegExp = filter.text.length > 0;
            if (filter.isRegExp) {
                filter.regExp = new RegExp(this.normalize(filter.text));
            }
            this.sortOrFilter();
        },
        modal_close() {
            this.$refs.modal.close();
        },
        modal_unapply_close() {
            const filter = this.hFilter[this.filterAdvancedIdx];

            filter.isRegExp = false;
            filter.text = '';
            this.$refs.modal.close();
            this.sortOrFilter();
        },
        // Desaplica todos los filtros activos
        filters_unapply() {
            for (let filter of this.hFilter) {
                if (filter.isRegExp) {
                    filter.isRegExp = false;
                    filter.text = '';
                }
            }
            this.sortOrFilter();
        },
        filter_advanced_field_add() {
            this.hFilter[this.filterAdvancedIdx].regExpFields.push('');
        },
        filter_advanced_field_sub(idx) {
            this.hFilter[this.filterAdvancedIdx].regExpFields.splice(idx, 1);
        },
        getPatternOfFields(filter) {
            switch (filter.regExpType) {
                case 'cont':
                    return filter.regExpFields.join('|');
                case 'ncont':
                    return `^((?!(${filter.regExpFields.join('|')})).)*$`;
                case 'match':
                    return `^(${filter.regExpFields.join('|')})$`;
                case 'nmatch':
                    return `^(?!(${filter.regExpFields.join('|')})$).*$`;
                case 'start':
                    return `^(${filter.regExpFields.join('|')})`;
                case 'nstart':
                    return `^(?!(${filter.regExpFields.join('|')}).*$).*$`;
                case 'end':
                    return `(${filter.regExpFields.join('|')})$`;
                case 'nend':
                    return `^(?!.*(${filter.regExpFields.join('|')})$).*$`;
            }
        },
        sortOrFilter(isSort = false, key = undefined) {
            if (isSort) {
                if (this.asc !== false) {
                    // Comprobamos si debemos hacer una copia
                    if (this.asc === undefined) {
                        this.unorderedRows = [...this.currentRows];
                        this.currentRows.sort(this.comparer(key));
                    }
                    this.asc = !this.asc;
                    if (!this.asc) {
                        this.currentRows.reverse();
                    }
                } else {
                    this.currentRows = this.unorderedRows;
                    this.unorderedRows = [];
                    this.asc = undefined;
                }
            } else {
                this.asc = undefined;
                this.unorderedRows = [];

                // Comprueba solo los filtros con contenido
                const filterKeys = [];
                for (let f of this.hFilter) {
                    if (!f.text) continue;

                    let filter;
                    if (f.isRegExp) {
                        filter = f.regExp;
                    } else {
                        filter = this.normalize(f.text);
                    }

                    filterKeys.push({
                        isRegExp: f.isRegExp,
                        filter,
                        key: f.key
                    });
                }

                // Agrega solo las filas que pasen los filtros de texto
                if (filterKeys.length) {
                    this.currentRows = [];
                    for (let row of this.rows) {
                        let add = true;
                        for (let i = 0; i < filterKeys.length; i++) {
                            let match;
                            if (filterKeys[i].isRegExp) {
                                match = filterKeys[i].filter.test(this.normalize(String(row[filterKeys[i].key])));
                            } else {
                                match = this.normalize(String(row[filterKeys[i].key])).indexOf(filterKeys[i].filter) >= 0;
                            }
                            if (!match) {
                                add = false;
                                break;
                            }
                        }

                        if (this.filterSelected) {
                            add = row.checked;
                        }

                        if (add) {
                            this.currentRows.push(row);
                        }
                    }
                } else {
                    if (this.filterSelected) {
                        this.currentRows = this.selectedRows;
                    } else {
                        this.currentRows = this.rows;
                    }
                }
            }

            this.setNumPages();
            this.$emit('filterChanged', this.currentRows);
        },
        /**
         * El comparador, usa una expresión regular para verificar si el valor de
         * la celda es una fecha, en cuyo caso se usa un comparador personalizado.
         * @param {string} key Clave del campo de ordenación.
         * @returns
         */
        comparer(key) {
            const self = this;

            return function (a, b) {
                const valA = a[key], valB = b[key];

                if (self.isDateString(valA) && self.isDateString(valB)) {
                    return self.compareDate(valA, valB);
                }

                if (self.isNumeric(valA) && self.isNumeric(valB)) {
                    return Math.sign(valA - valB);
                } else {
                    return valA.localeCompare(valB);
                }
            }
        },
        isDateString(date) {
            return /^\d{2}(?:\/|-)\d{2}(?:\/|-)\d{4}$/.test(date);
        },
        isNumeric(expr) {
            if (typeof (expr) === 'number' || typeof (expr) === 'bigint') {
                return true;
            } else if (typeof (expr) === 'string') {
                return /^\s*[+-]?\d+(?:\.\d+)?(?:[Ee][+-]?\d+)?\s*$/.test(expr);
            } else {
                return false;
            }
        },
        /**
         * Compara dos fechas en formato dd/mm/aaaa o dd-mm-aaaa.    
         * @param {string} valA Fecha en formato dd/mm/aaaa o dd-mm-aaaa.
         * @param {string} valB Fecha en formato dd/mm/aaaa o dd-mm-aaaa.
         * @returns
         */
        compareDate(valA, valB) {
            const dateA = new Date(valA.replace(this.reGroupedDateString, "$2/$1/$3"));
            const dateB = new Date(valB.replace(this.reGroupedDateString, "$2/$1/$3"));

            return dateA > dateB ? 1 : -1;
        },
        /**
         * Normaliza una cadena quitando los signos diacríticos y convirtiéndola a minúsculas.
         * @param {string} text Cadena que se normalizará.
         * @returns {string} Cadena normalizada.
         */
        normalize(text) {
            return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        },
        setNumPages() {
            this.numPages = Math.ceil(this.currentRows.length / this.rowsPerPage);
            this.currentPage = 1;
            this.showCurrentPage();
        },
        prevPage() {
            if (this.currentPage === 1) return;
            this.currentPage--;
            this.showCurrentPage();
        },
        nextPage() {
            if (this.currentPage === this.numPages) return;
            this.currentPage++;
            this.showCurrentPage();
        },
        currentPage_enter() {
            if (this.currentPage < 1 || this.currentPage > this.numPages) return;
            this.showCurrentPage();
        },
        // Muestra la página actual
        showCurrentPage() {
            // Calculamos el paginado
            const start = (this.currentPage - 1) * this.rowsPerPage;
            this.paginated = this.currentRows.slice(start, start + this.rowsPerPage);
            this.$emit('paginatedChanged', this.paginated);
        },
        download_csv() {
            this.downloadFileCSV('datos.csv', this.getRowsToCsv());
        },
        // Descarga un fichero simulando un click
        downloadFileCSV(filename, content) {
            /* Se le agrega el BOM U+FEFF que indica
            condificación UTF-16 Big-Endian, y es requerido para
            que  Excel lo interprete correctamente */
            content = '\ufeff' + content;

            // Lo inyecta en un Blob
            const blob = new Blob([content], { type: '' });

            // Utiliza la técnica de la descarga al hacer click
            const el = document.createElement('a');
            el.href = URL.createObjectURL(blob);
            el.download = filename;
            document.body.appendChild(el);
            el.click();
            // Se borra el elemento creado
            document.body.removeChild(el);
        },
        // Devuelve la filas en una cadena con formato CSV        
        getRowsToCsv() {
            // Generamos la cadena en formato CSV            
            const sb = [];

            // Trabajaremos con las cabeceras
            const hs = this.headers.filter(h => h.checked);

            // Cabeceras del CSV            
            for (let i = 0; i < hs.length; i++) {
                sb.push('\"');
                sb.push(hs[i].title.replaceAll("\"", "\"\""));
                sb.push('\"');
                if (i < (hs.length - 1)) {
                    sb.push(';');
                }
            }
            sb.push('\n');

            // Cuerpo del CSV            
            for (let r of this.currentRows) {
                for (let i = 0; i < hs.length; i++) {
                    sb.push('\"');
                    sb.push(String(r[hs[i].key] ?? '').replace("\"", "\"\""));
                    sb.push('\"');
                    if (i < (hs.length - 1)) {
                        sb.push(';');
                    }
                }
                sb.push('\n');
            }

            return sb.join('');
        },
        /**
         * Establece los estilos del componente.
         */
        setComponentStyles() {
            // Si los estilos ya están registrados sale                        
            if (document.querySelector(`head > style[${this.componentUid}]`)) return;
            const cssText = /*css*/`                
                .${this.componentUid} .filter-controls {
                    display: flex;
                    justify-content: center;
                    align-items: baseline;
                }
               
                .${this.componentUid} .sort {
                    cursor: pointer;
                    margin-right: 0.5rem;
                }

                .${this.componentUid} .input-filter {
                    display: inline-block; width: 69%;
                }
               
                .${this.componentUid} .table {
                    border-collapse: collapse;    
                    margin: auto;                    
                }

                .${this.componentUid} .table th, .${this.componentUid} .table td {
                    border: 1px solid black;    
                    padding: 0.5rem;    
                }
               
                .${this.componentUid} .table thead th {
                    text-align: center;
                }
               
                .${this.componentUid} .table tr:nth-child(even) {
                    background-color: rgba(192, 192, 192, 0.205);
                } /* Formato de filas pares */
               
               
                /* Color de fondo al pasar sobre una fila */
                .${this.componentUid} .table tr:hover > td:not(tfoot td) {
                    background-color: rgba(154, 228, 241, 0.301);
                }

                .${this.componentUid} .top-controls {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 3rem;
                }
               
                .${this.componentUid} .paginator-controls {
                    margin: 0.25rem;
                    text-align: center;
                    font-family: initial;
                }                
               
                .${this.componentUid} .filters-unapply {
                    background-color: tomato;
                }

                .${this.componentUid} .dialog-modal {
                    max-width: 50vw;
                    padding: 0.50rem;
                }

                .${this.componentUid} .dialog-modal::backdrop {
                    background-color: rgba(0, 0, 0, 0.53);
                }

                .${this.componentUid} .dialog-modal-title {
                    text-align: center;
                    margin: 0.25rem;
                }

                .${this.componentUid} .dialog-header {
                    display: flex;
                    justify-content: center;
                    gap: 0.25rem;
                }

                .${this.componentUid} .dialog-body {
                    padding: 0.25rem;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    gap: 0.25rem;
                }                

                .${this.componentUid} .dialog-footer {
                    display: flex;
                    justify-content: center;
                    gap: 0.25rem;
                }

                .${this.componentUid} .filter-advanced {
                    background-color: lightgreen;
                }

                .${this.componentUid} .columns-multiselect {
                    position: relative;
                    margin: 0.16rem;
                }

                .${this.componentUid} .columns-multiselect-checkboxes {
                    position: absolute;
                    z-index: 1;
                    background-color: lightgray;
                    border: 1px solid black;
                }

                .${this.componentUid} .columns-multiselect-label-main {
                    background-color: #fff5cc;"
                }

            `;
            const style = document.createElement('style');
            // Establece un atributo para identificar los estilos
            style.setAttribute(this.componentUid, '');
            style.appendChild(document.createTextNode(cssText));
            document.getElementsByTagName('head')[0].appendChild(style);
        },
        updateHeaderFilters() {
            this.hFilter = [];
            for (let h of this.headers.filter(h => h.checked)) {
                this.hFilter.push({
                    text: '',
                    key: h.key,
                    isRegExp: false,
                    regExpType: this.filterAdvancedOptions[0].value,
                    regExpFields: [''],
                    regExp: ''
                });
            }
        },
        change() {
            this.updateHeaderFilters();
            this.currentRows = this.rows;
            this.$emit('filterChanged', this.currentRows);
            this.setNumPages();            
            this.sortOrFilter();
        }
    },
    computed: {        
        /**
         * Devuelve un nombre de componente único.
         * @returns {string}
         */        
        componentUid() {
            // Buscamos el nombre del componente
            let name = null;
            for (const entry of Object.entries(Vue.getCurrentInstance().appContext.components)) {
                if (this.$options === entry[1]) {
                    name = entry[0];
                    break;
                }
            }
                      
            return `vue-${name}-${btoa(name).replace(/[+/=]/g, '')}`;
        },
        selectedRowsEqualsRows() {
            if (this.selectedRows.length < this.currentRows.length) return false;

            // Solo es necesario verificar los de la página actual
            for (let p of this.paginated) {
                let match = false;
                for (let s of this.selectedRows) {
                    if (s === p) {
                        match = true;
                        break;
                    }
                }
                if (!match) {
                    return false;
                }
            }

            return true;
        },
        visibleColumn(col) {
            return this.selectedColumns.some(c => c === col)
        },
        reDateString() {
            return /^\d{2}(?:\/|-)\d{2}(?:\/|-)\d{4}$/;
        },
        reGroupedDateString() {
            return /^(\d{2})(?:\/|-)(\d{2})(?:\/|-)(\d{4})$/;
        },
        sortTitle() {
            return 'Ordena de forma ascendente o descendente, según el tipo de dato de la columna';
        },
        filterTitle() {
            return 'Permite filtrar por el texto introducido, no se distiguen mayúsculas de minúsculas ni letras acentuadas o no';
        },
        appliedFilters() {
            for (let f of this.hFilter) {
                if (f.isRegExp) {
                    return true;
                }
            }
            return false;
        }
    },
    watch: {        
        /**
         * Es necesario escuchar para recalcular las filas visibles
         * debido a que las filas podrían cargarse de forma asíncrona.        
         */
        'rows.length'() {
            this.change();
        },        
        /**
         * Si las cabeceras cambian dinámicamente, marca
         * como visibles todas las columnas.
         */
        'headers.length'() {
            this.columnsSelecChange(true, null);
        },
        // Si cambia el filtro de selección
        filterSelected() {
            this.sortOrFilter();
        }
    },
    created() {
        // Establece los estilos del componente
        this.setComponentStyles();
        this.columnsSelecChange(true, null);
        this.change();
    },
    mounted() {
        document.addEventListener('click', this.clickOutside);
        this.$refs.modal.onsubmit = this.modal_submit;
    },
    unmounted() {
        document.removeEventListener('click', this.clickOutside);
    }
});