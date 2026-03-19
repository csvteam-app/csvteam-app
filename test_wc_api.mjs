import fetch from 'node-fetch';

async function testWcApi() {
    try {
        console.log("Provo l'API Store di WooCommerce...");
        const res = await fetch('https://www.csvteam.com/wp-json/wc/store/products');
        if (!res.ok) {
            console.log("Store API fallback non disponibile:", res.status, res.statusText);
            
            // Provo fallback su API custom se esistente
            const res2 = await fetch('https://www.csvteam.com/wp-json/wp/v2/product');
            if(res2.ok) {
                const data2 = await res2.json();
                console.log("Trovato tramite wp/v2/product!", data2.length, "prodotti");
                return;
            }
            return;
        }
        
        const data = await res.json();
        console.log("Successo! Trovati", data.length, "prodotti");
        
        data.forEach(p => {
            console.log(`- ID: ${p.id} | Name: ${p.name} | Price: ${p.prices.price/100}`);
        });
    } catch (err) {
        console.log("Errore:", err.message);
    }
}

testWcApi();
