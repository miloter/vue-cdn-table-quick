const app = Vue.createApp({
    template: /*html*/`
        <table-quick :headers="headers" :rows="rows" :rowsPerPage="2"
            controlPosition="both" :csvExport="true" :multiselect="true"            
            @filterChanged="onFilterChanged"
            @paginatedChanged="onPaginatedChanged"
            @selectedChanged="onSelectedChanged"
            @selectedColumnsChanged="onSelectedColumnsChanged"
            @expandChanged="onExpandChanged">
            <template #extra="{ row }">
                {{ row }}
            </template>
            <template #['thumbnailUrl']="{ row }">                                            
                <img :src="row.thumbnailUrl" width="150" alt="Miniatura de imagen">                
            </template>            
        </table-quick>    
    `,
    data() {
        return {            
            headers: [{
                title: 'ID',
                key: 'id',
                showFilter: true
            }, {
                title: 'Title',
                key: 'title',
                showFilter: true
            }, {
                title: 'URL',
                key: 'url',
                showFilter: true
            }, {
                title: 'Imagen URL',
                key: 'thumbnailUrl',                                
            }],
            rows: []
        }
    },
    methods: {        
        async fetchRows() {
            const json = await fetch(this.apiUrl).then(resp => resp.json());            
            this.rows = json.map((r, i) => {                
                r.thumbnailUrl = r.thumbnailUrl;
                return r;
            });
        },
        onFilterChanged(currentRows) {
            console.log('nuevo filtrado de ' + currentRows.length + ' filas');
        },
        onPaginatedChanged(paginatedRows) {
            console.log('nueva página de ' + paginatedRows.length + ' filas');
        },
        onSelectedChanged(selectedRows) {
            console.log('nueva selección de ' + selectedRows.length + ' filas');
        },        
        onSelectedColumnsChanged(selectedColums) {
            console.log('nueva selección de ' + selectedColums.length +
                ' columnas:', selectedColums);
        },
        onExpandChanged(isOpened, row) {
            console.log('Fila expandida: ' + isOpened, ':', row);
        }        
    },
    computed: {
        apiUrl() {
            return 'https://jsonplaceholder.typicode.com/photos';
        }
    },
    created() {
        this.fetchRows();        
    }
}); 