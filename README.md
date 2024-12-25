# table-quick: Componente Vue para usar en aplicaciones basadas en CDN
Este componente permite:
* Ordenar, filtro simple y avanzado, selección múltiple
* Contenido extra, personalización del contenido
* Selección de columnas visibles y más.
* Optimizado para velocidad.


## Uso
```html
<script src="components/table-quick.js"></script>
```

## Ejemplo
### HTML
```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tabla de datos con ordenación y filtrado</title>
    <script src="https://unpkg.com/vue@3.4.5/dist/vue.global.js"></script>
</head>

<body>
    <div id="app"></div>
    <script src="app.js"></script>
    <script src="components/table-quick.js"></script>
    <script>app.mount('#app');</script>
</body>
</html>
```

### JS/app.js
```js
const app = Vue.createApp({
    template: /*html*/`
        <table-quick :headers="headers" :rows="rows" :rowsPerPage="4"
            controlPosition="both" :csvExport="true"
            @filterChanged="onFilterChanged" @paginatedChanged="onPaginatedChanged">            
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
            console.log('nuevo filtrado de ' + currentRows.length + ' filas ');
        },
        onPaginatedChanged(paginatedRows) {
            console.log('nueva página de ' + paginatedRows.length + ' filas ');
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
```
