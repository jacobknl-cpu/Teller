const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let money = 800, lives = 100, wave = 0, isWaveActive = false, frame = 0;
let gameSpeed = 1, autoWave = false;
let towers = [], enemies = [], projectiles = [], floatingTexts = [];
let selectedType = null, pendingPos = null, activeTower = null;

function gameLoop() {
    // Kjør logikk flere ganger per frame basert på gameSpeed
    for(let i=0; i < gameSpeed; i++) {
        frame++;
        updateLogic();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

function updateLogic() {
    if(lives <= 0) return;

    // Fiende-logikk
    enemies.forEach((e, i) => {
        let target = path[e.targetIdx];
        let d = Math.hypot(target.x - e.x, target.y - e.y);
        if(d < 2) { 
            e.targetIdx++; 
            if(e.targetIdx >= path.length) { 
                enemies.splice(i,1); 
                lives--; 
                updateUI(); 
                return; 
            } 
        }
        e.x += ((target.x - e.x)/d)*e.speed;
        e.y += ((target.y - e.y)/d)*e.speed;
        e.dist += e.speed;
    });

    // Tårn-logikk
    towers.forEach(t => {
        t.timer++;
        if(t.type === 'gen') {
            if(isWaveActive && t.timer >= t.rate) {
                money += t.income; 
                t.timer = 0; 
                updateUI();
                floatingTexts.push({x: t.x, y: t.y, text: "+"+Math.floor(t.income), a: 1});
            }
        } else if(t.timer >= t.rate) {
            let targets = enemies.filter(en => Math.hypot(en.x - t.x, en.y - t.y) < t.range);
            if(targets.length > 0) {
                let target = targets.sort((a,b) => b.dist - a.dist)[0];
                t.timer = 0;
                projectiles.push({x: t.x, y: t.y, target, speed: 10, dmg: t.dmg, aoe: t.aoe || 0, color: t.pColor, tower: t});
                if(t.type === 'blast') t.shock = 0.1;
            }
        }
        if(t.shock > 0) { t.shock += 0.05; if(t.shock > 1.5) t.shock = 0; }
    });

    // Prosjektil-logikk
    projectiles.forEach((p, i) => {
        let d = Math.hypot(p.target.x - p.x, p.target.y - p.y);
        if(d < 10 || !enemies.includes(p.target)) {
            if(p.aoe > 0) {
                enemies.forEach(en => {
                    if(Math.hypot(en.x - p.x, en.y - p.y) < p.aoe) damageEnemy(en, p.tower);
                });
            } else { 
                damageEnemy(p.target, p.tower); 
            }
            projectiles.splice(i, 1);
        } else {
            p.x += ((p.target.x - p.x)/d)*p.speed;
            p.y += ((p.target.y - p.y)/d)*p.speed;
        }
    });

    floatingTexts.forEach((f, i) => { f.y -= 0.5; f.a -= 0.01; if(f.a <= 0) floatingTexts.splice(i,1); });
    
    // Sjekk om bølgen er over
    if(isWaveActive && enemies.length === 0) {
        isWaveActive = false;
        if(autoWave) setTimeout(startSector, 1000 / gameSpeed);
    }
}

function damageEnemy(e, tower) {
    if(!e) return;
    e.hp--;
    if(e.hp <= 0) { 
        money += 50; 
        if(tower) tower.kills++; 
        enemies.splice(enemies.indexOf(e), 1); 
        updateUI(); 
    }
}

function draw() {
    ctx.clearRect(0,0,800,600);
    
    // Tegn bane
    ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 40; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
    path.forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke();

    // Tegn tårn
    towers.forEach(t => {
        ctx.save(); ctx.translate(t.x, t.y);
        if(t.type === 'pulse') {
            ctx.fillStyle = '#1e293b'; ctx.fillRect(-18, -18, 36, 36);
            ctx.fillStyle = t.color; ctx.beginPath(); ctx.arc(0, 0, 10 + Math.sin(frame*0.05)*3, 0, Math.PI*2); ctx.fill();
        } else if(t.type === 'beam') {
            ctx.fillStyle = t.color; ctx.fillRect(-15, -15, 30, 30);
            ctx.fillStyle = 'white'; ctx.fillRect(-2, -20, 4, 10);
        } else if(t.type === 'blast') {
            ctx.fillStyle = t.color; ctx.beginPath(); ctx.moveTo(-15, 15); ctx.lineTo(0, -15); ctx.lineTo(15, 15); ctx.fill();
            if(t.shock > 0) { 
                ctx.strokeStyle = `rgba(255,255,255,${1-t.shock/1.5})`; 
                ctx.beginPath(); ctx.arc(0,0, t.shock*40, 0, Math.PI*2); ctx.stroke(); 
            }
        } else if(t.type === 'gen') {
            ctx.fillStyle = t.color; ctx.fillRect(-15, -15, 30, 30);
            ctx.strokeStyle = 'white'; ctx.strokeRect(-18, -18, 36, 36);
        }
        ctx.restore();
        
        if(activeTower === t) {
            ctx.strokeStyle = 'white'; ctx.lineWidth = 1; ctx.setLineDash([5,5]);
            ctx.beginPath(); ctx.arc(t.x, t.y, t.range, 0, Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
        }
    });

    // Tegn fiender
    enemies.forEach(e => {
        ctx.fillStyle = '#e11d48'; ctx.beginPath(); ctx.arc(e.x, e.y, 10, 0, Math.PI*2); ctx.fill();
        if(e.hp < e.maxHp) {
            ctx.fillStyle = '#000'; ctx.fillRect(e.x-10, e.y-15, 20, 3);
            ctx.fillStyle = '#10b981'; ctx.fillRect(e.x-10, e.y-15, (e.hp/e.maxHp)*20, 3);
        }
    });

    // Tegn effekter
    projectiles.forEach(p => { ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2); ctx.fill(); });
    floatingTexts.forEach(f => { ctx.globalAlpha = f.a; ctx.fillStyle = '#f59e0b'; ctx.font = "bold 14px Arial"; ctx.fillText(f.text, f.x-10, f.y); ctx.globalAlpha = 1; });
}

gameLoop();
