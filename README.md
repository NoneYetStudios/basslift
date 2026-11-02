# Bass Shoplifting Championship

**Weigh increasingly ridiculous bass and compete in absurd lifting championships.**
*There's also a giant, two-story indoor aquarium. What you do with that information is entirely up to you.*

---

## Overview

**Bass Shoplifting Championship** is a complete browser-based arcade game set inside the **Grand Rotunda Aquarium & Athletic Lifting Pavilion**—a facility where people take competitive fish weightlifting far too seriously.

### Key Features

1. **Two-Story Indoor Aquarium Main Environment**:
   - Multi-depth animated aquarium populated with swimming bass (including specimens from your own collection), rising bubble columns, swaying kelp, sunken barbells, a second-story observation balcony, and **Officer Barnaby** on security patrol.
   - Integrated environmental navigation:
     - **Championship Archway & Official Weigh-In Scale** (`ENTER CHAMPIONSHIP`)
     - **Live-Well Specimen & Gear Kiosk** (`FISH COLLECTION`)
     - **Rotunda Jumbotron Scoreboard** (`HALL OF FAME & GLOBAL LEADERBOARD`)
     - **Facility Control Box** (`SETTINGS`)
     - **The Prominent `NO FISHING` Sign** in the bottom-right foreground—which is clickable and opens the sneaky **Aquarium Fishing** minigame.
2. **Six Distinct Lifting Disciplines**:
   - **Clean & Jerk**: Two-stage lift—rack the bass onto your shoulders in Stage 1, then lock the converging split-jerk markers in Stage 2.
   - **Snatch**: Single continuous velocity curve trace from floor to overhead lockout.
   - **Dumbbell Lift (Twin-Bass Curl)**: Lift two fish simultaneously—pump left and right arms independently while keeping spinal tilt balanced.
   - **Deadlift**: Build hydraulic pulling force against gravity to haul the bass into the top lockout window without hitching.
   - **Bench Press**: Feather your brake to control descent speed to the chest, pause for the referee's `"PRESS!"` signal, and hit the drive meter.
   - **Overhead Press**: Counter-steer an inverted pendulum overhead for 4.2 seconds as the slippery bass shifts its center of mass.
3. **Fish Collection, 5 Rarity Tiers & Unlockable Gear**:
   - 17 distinct species across **Common**, **Uncommon**, **Rare**, **Legendary**, and **Ridiculous** rarities, rendered via custom procedural SVG illustrations.
   - 5 Weight Divisions (**Lightweight**, **Middleweight**, **Heavyweight**, **Super Heavyweight**, **Unlimited**) and unlockable lifting gear.
4. **Persistent SQLite Global Leaderboard**:
   - Server-side SQLite database (`data/leaderboard.sqlite`) storing verified global rankings across Overall Competition Score, Discipline Records, Heaviest Fish Lifted, Largest Fish Caught, and Championship Victories.
   - Local career progress, fish collection, and personal records persist separately in browser `localStorage`.

---

## Running Locally

### Prerequisites
- **Node.js** `>= 22.5.0` (uses Node's built-in `node:sqlite` module—zero external npm dependencies required).

### Start the Server
```bash
npm start
```
Then open `http://127.0.0.1:8080` in your browser.

### Run Automated Tests (Unit + SQLite API + Headless Chrome E2E)
```bash
npm test
```

### Apache / PHP Shared Hosting Compatibility
In addition to `server.js` (`node:sqlite`), the repository includes `.htaccess` and `api/index.php` (PDO SQLite) implementing the identical `/api/health` and `/api/leaderboard` endpoints for Apache/LiteSpeed deployments.
