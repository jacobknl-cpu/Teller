const units = {
    'pulse': { name: 'Pulse Unit', cost: 200, range: 130, rate: 45, dmg: 1, color: '#38bdf8', pColor: '#7dd3fc' },
    'beam': { name: 'Beam Unit', cost: 450, range: 350, rate: 80, dmg: 2, color: '#fbbf24', pColor: '#fde68a' },
    'blast': { name: 'Blast Core', cost: 750, range: 170, rate: 110, dmg: 1, aoe: 70, color: '#f87171', pColor: '#ef4444' },
    'gen': { name: 'Credit Gen', cost: 900, range: 0, rate: 450, income: 200, color: '#a855f7', pColor: '#d8b4fe' }
};

const path = [
    {x:0, y:300}, {x:200, y:300}, {x:200, y:100}, 
    {x:600, y:100}, {x:600, y:500}, {x:400, y:500}, 
    {x:400, y:300}, {x:800, y:300}
];
