# NIGHTFREIGHT — design document

**The first draft is built and playable: `games/nightfreight/index.html`.**
This document is now the record of what was decided and why.

A trading game on the Space Trader chassis. The economy, the encounter loop and
the police record are the proven 2002 design, matched close to one-to-one. The
innovation is the three valleys, the crew, and what is being hauled.

---

## Pitch

You drive a truck between settlements in a country where the nights are not
safe, and the most profitable cargo is blood, and nobody will tell you where it
comes from.

**Win condition:** a berth on the boat at Halloway, which is the only way out of
the country, and which costs 500,000. The berths are sold one at a time.

**The ending does not score you.** It says who is on the boat, who is standing
on the dock, how many teeth you sold and how many loads you took through a farm
gate. If you bought a spare berth and left the name blank, it says that too, and
it does not say whether that was good. The man on the quay does not ask what you
are; he asks for the money.

---

## What is copied from Space Trader, deliberately

| System | Original | Ours |
|---|---|---|
| Skills | Pilot, Fighter, Trader, Engineer (1–10) | **Driving, Fighting, Dealing, Mending** (1–10) |
| Crew | 1–3 quarters, so **at most 2 hires**; 29 mercenaries; skills read as a max | 1–4 **seats**; 12 crew; **Fighting is shared** |
| Vehicle | 15 ships: cargo / weapon / shield / gadget / crew / fuel / hull | 6 trucks: cargo / mounts / plating / fittings / seats / fuel / frame |
| Weapons | 4 lasers, power 10/15/25/40 | 4 mounts, same power curve |
| Shields | 3, power 20/35/50 | 3 platings, same |
| Gadgets | 6 | 6 fittings, same prices |
| Goods | 10, price 30–5000, demand tied to local events | 10, same shape |
| Contraband | Narcotics and Firearms, **legality set per government** | **Blood and Ammunition, legality set per settlement** |
| Reputation | police record −70…+75, **and** combat reputation 0…1500 | **Warrant** alone — the second scale is cut |
| Encounters | police / pirate / trader | patrol / raider / hauler |

The one thing the original gets wrong and we fix: its police record only ever
*closes* doors. Ours opens one.

---

## The map — three valleys

One country, one continuous map. **You can always go back.** Route knowledge is
the player's real asset and taking it away is confiscating what they earned.

The valleys are separated by **Bureau checkpoints**. Passing costs a fee, an
hour, and a Warrant check. So going home is possible and never free.

**Doors close by consequence, not by design.** Below Marked, the checkpoints go
from an inconvenience to the most dangerous thing on the map, and the outlaw
finds he cannot go home without anyone having built a wall.

| | Settlements | Opens | Character |
|---|---|---|---|
| **Colter** | Fenner, Tolm, Bright's Ford, Ashgate | start | Farms, a mill, thin margins. Human raiders. |
| **Vann** | Sennick, Doulton, Marrow, Cade | after the Tolm contract | Industry, Bureau posts, real money. First *evidence*. |
| **The Kell** | Halloway, Ossett, Vire, Rook's End, Pell | after the checkpoint scene | The port, the farms, and the vampires. |

---

## Goods

Prices are the low–high band; the local event pushes within and past it.

| Good | Band | Legality | Moves on |
|---|---|---|---|
| Water | 30–50 | free | drought, siege |
| Flour | 90–160 | free | crop failure |
| Fuel | 150–260 | free | everything |
| Seed | 200–300 | free | after a failure |
| Liquor | 300–500 | free | quiet, and a hunt |
| Medicine | 400–700 | free | fever |
| Machine parts | 600–800 | free | a strike |
| Salvage | 250–450 | free | after a raid |
| **Ammunition** | 600–1100 | **restricted in 4 of 13** | a hunt, a siege |
| **Blood** | 2000–3000 | **restricted in 9 of 13** | always |

**Restricted does not mean absent.** There is a buyer everywhere; where it is
restricted there is a buyer *and a risk*, so the price carries the risk — about
20% over, against 10% under where it is open. That is where the whole blood
margin comes from, and it means the temptation is on the board from Fenner on
day one rather than waiting for the Kell. Buying or selling restricted goods
where they are restricted costs Warrant even when nobody stops you, because
somebody watched the crates come off.

**Fangs are not a trade good.** They are sold to Bureau posts at a published
schedule price — 1,200 for ten days after they are drawn, 700 after that.
Selling raises Warrant, and hardens everybody in the cab.

**Local events:** quiet · siege · fever · hard frost · crop failure · a strike ·
a hunt (Bureau sweep).

---

## The truck

| Truck | Cargo | Seats | Mounts | Plating | Fittings | Fuel | Frame | Price |
|---|---|---|---|---|---|---|---|---|
| Panel van | 10 | 1 | 0 | 0 | 0 | 14 | 4 | start |
| Flatbed | 15 | 2 | 1 | 0 | 1 | 16 | 5 | 10,000 |
| Box truck | 25 | 2 | 1 | 1 | 2 | 15 | 5 | 30,000 |
| **Coach** | 20 | **4** | 1 | 1 | 2 | 14 | 4 | 75,000 |
| Hauler | 45 | 3 | 2 | 2 | 3 | 13 | 6 | 150,000 |
| Armoured hauler | 35 | 3 | 3 | 3 | 3 | 12 | 8 | 300,000 |

**The Coach was too obviously right, so it is now soft.** Four seats, and one
mount and one plating to defend them with — because it is a bus, and the sides
are glass. It is the worst cargo-per-credit in the game, it is the only truck
that carries four people, and taking it into the Kell means taking four people
into the Kell in a vehicle that cannot take a hit. That is the trade, and it is
a real one now.

**Mounts** (power 10 / 15 / 25 / 40): shotgun rack 2,000 · rifle mount 12,500 ·
heavy mount 35,000 · the Doulton gun 50,000 (not for sale).

**Plating** (20 / 35 / 50): mesh 5,000 · plate 20,000 · plate and mesh 45,000.

**Fittings**: roof rack (+5 cargo) 2,500 · toolkit (auto-repair) 7,500 · maps and
radio 15,000 · floodlights (night targeting) 25,000 · muffled engine (run dark)
100,000 · long tank 30,000.

---

## The roster — eight, four skills each, one trait

Every seat is a crate you are not carrying. That is the whole cost model.

Twelve was four too many, so four are gone: **Beck** (his checkpoint discount
only did what Warrant already does), **Tomasz** (deliberately featureless — with
eight, everybody has to have an edge), **Marya Doust** (she needed an injury
system that does not exist yet) and **Halda Vey** (a second driver behind Sull,
gated on a night-contract system that does not exist either).

What is left is four specialists, one investment, one outlaw, two priests — and
one you cannot hire.

| | Dri | Fig | Dea | Men | Wage | Trait |
|---|---|---|---|---|---|---|
| **Ivar Sull**, ex-haulage | 8 | 2 | 4 | 3 | 51 | Will not drive at night, and will not sit in the back and watch you do it |
| **Ruta Kelm**, buyer | 2 | 1 | 9 | 2 | 42 | Reads a market. Will not haggle over medicine |
| **Ollie Frame**, mechanic | 3 | 2 | 2 | 9 | 48 | Fixes anything. Drinks, which costs you every day |
| **Sten**, raider turned | 6 | 8 | 2 | 3 | 57 | The best gun on the road, and he hardens twice as fast as anyone |
| **Corin Wace**, boy | 5 | 3 | 3 | 4 | 45 | Nineteen and useless. Gains a point every six weeks, to seven |
| **Nessa Roan**, smuggler | 6 | 4 | 7 | 2 | 57 | Halves the Warrant cost of a blood run. Will not walk up to a clean truck |
| **Fr. Emil Sarto** | 2 | 1 | 3 | 4 | 30 | Holds that the trade is licit. Will ride on a blood run and say grace over it |
| **Fr. Jan Kwiat** | 1 | 1 | 2 | 5 | 27 | Holds that the not-knowing is the point. Gets out when blood is loaded |
| **Andrej Vist** | 6 | 10 | 2 | 3 | — | Not for hire. See below |

Wace is the one the whole seat economy is built around: you carry somebody who
is worth nothing now because of what he will be in four months. That is a bet,
and it costs you 45 a day and a crate every day you hold it.

---

---

## Crew — how Space Trader does it, and what we change

**The original, read off the source rather than remembered:**

- **29 mercenaries**, rolled once when the game begins. Each skill is
  `1 + d5 + d6`: one to ten, but 5 and 6 are common and a 10 is about a 3% roll.
- **Each is pinned to one solar system for the entire game**, one per system, out
  of 120. They never move. A system shows **at most one**, and there is no way
  to learn who is where except by going there.
- **Hiring is free.** The cost is a **daily wage**: the sum of his four skills
  × 3, taken for every day you travel.
- **You can carry two.** Ships have 1–3 crew quarters and one is yours; only
  four of the ten buyable ships have room for a second hire.
- **The ship's skill in each area is the *highest* aboard — not the sum.**
- **Firing is free and instant**, and the man goes back on the roster at his home
  system, not where you dropped him.
- **Mercenaries never improve.** Only the commander does.

**Where that goes wrong.** Because skills read as a maximum, the second hire is
usually worth nothing. Once anybody aboard has Pilot 9, every other pilot in the
game is a wage with no return. Twenty-nine people collapse into one question —
*whose one number is high?* — and crew stops being people and becomes a gadget
you have to feed.

### 1. Fighting is shared. The other three are not.

One person drives. One talks the price. The best mechanic does the work and the
others hand him tools. But in a fight everybody shoots.

> **Driving, Dealing, Mending** — the best aboard, and nobody else counts.
> **Fighting** — the best aboard, plus half of each other person's, rounded down.

Sull 2, Beck 7, Sten 8, Tomasz 6 gives you 8 + 1 + 3 + 2 = **14**, against 8 for
the same man riding alone. That one rule is the entire reason a fourth seat can
be worth having — and it is still not obviously right, because a seat is a crate
you are not carrying and a wage you pay every single day.

### 2. Wages, same arithmetic as the original

Sum of the four skills × 3, per day. Four decent people run about 200 a day.
Against a flour run that is more than half the profit. Against a blood run it is
six percent. **The roster you can afford is a function of what you are willing
to haul** — which is the game, stated as a wage bill.

### 3. Pinned to place, like the original — but gated by history, not luck

Thirteen settlements and twelve people. If each simply sat at home, one lap of
the map would hand you the whole roster and there would be nothing left to find.
So everyone has a home **and** a condition. Some are there the first day. The
rest turn up once you have done the thing that would make a person get into a
truck with you.

| | Where | When |
|---|---|---|
| Ivar Sull | Fenner | day one |
| Ollie Frame | Tolm | day one |
| Fr. Jan Kwiat | Tolm | day one |
| Ruta Kelm | Bright's Ford | day one |
| Fr. Emil Sarto | Ashgate | day one |
| Corin Wace | Bright's Ford | the second time you come through |
| Sten | Ashgate | after you have beaten a raider |
| Tomasz | Sennick | day one in Vann |
| Marya Doust | Doulton | after somebody in your cab gets hurt |
| Beck | Marrow | after an inspection has cost you real money |
| Halda Vey | Cade | after one night run |
| **Nessa Roan** | Marrow | **Watched or worse** — she will not walk up to a clean truck |

You still cannot see who is where without driving there. **Maps and radio**
(15,000) tells you a settlement has somebody looking for a seat. It does not
tell you who.

### 4. They change, and the original's never do

*Steady → hard → gone.* Fang hunting and night fighting move them along it.

| | Fighting | Dealing | And |
|---|---|---|---|
| steady | — | — | — |
| **hard** | +2 | −2 | refuses one thing he used to do |
| **gone** | +3 | −4 | will haul anything, and stops going to the priest |

Only a priest moves anyone back, and he takes a seat to do it. Corin Wace is the
one person who drifts the other way: +1 to a skill every six weeks, up to 7.

### 5. Firing is free, and he waits where you left him

Which makes one thing worth saying out loud. **Putting Kwiat out at the post
before you load blood is not the same as his permission.** Nothing changes
numerically — the crew harden exactly as they would if he had never been aboard,
because he is not aboard. The only consequence is that he says so when you come
back for him. That is enough.

---

## The two priests

The blood trade's origin is **genuinely unknowable** to anyone in the game. This
is not a secret to be uncovered; it is the actual condition. So the moral
question is not *what is true* but *how to act when you cannot know* — which is
the classical problem of **material cooperation**, and where serious people
disagree.

**Fr. Emil Sarto** — the trade is licit. Blood in crates is blood not taken off
a road at night. Refusing does not end the trade; it hands the route to someone
who will not stop for anybody. He will ride on a blood run and say grace over it.

**Fr. Jan Kwiat** — the not-knowing is the point. You do not get to take the
benefit of an ignorance you never disturbed, and a market that cannot account
for its supply has decided not to. **He will not ride on a blood run**, and if
one is loaded while he is aboard he gets out and waits at the next post.

Both are arguable. Neither is a straw man. **Which one takes the seat is a
position you are buying**, and Kwiat's costs you the best cargo in the game
every week for a year.

**Both give the vampire bonus.** From the Kell onward, a vampire that closes on
a truck with a priest aboard **breaks off or hesitates** — your crew moves
first, or you disengage clean. He does not fight and has no Fighting to speak
of. They falter, because they are people and they remember what he is.

Sarto accepts being carried for that reason. **Kwiat notices, and says so.**

---

## Warrant — the one reputation scale

**Renown is cut.** In the actual source, Space Trader's combat reputation does
three things and no more: raiders break off when it is high, it gates two side
quests, and it goes up when you kill. The valleys already escalate who you meet,
and they do it more legibly. One scale is enough.

**Warrant** (their police record, −70…+75):
Wanted −50 · Marked −20 · Watched −5 · **Clean 0** · Licensed +10 · Bonded +30 ·
Commended +60

Warrant then does four jobs. Three of them are already in the original and I had
not given them enough credit:

1. **It sets how hard a patrol hits you.** Space Trader multiplies police
   strength by 2 below Villain and by 3 below Psychopath. Same rule here: below
   Marked, the Bureau stops inspecting and starts hunting. That is the job
   Renown looked like it was doing.
2. **It sets the fine**, scaled to what you are worth — so getting rich never
   makes the law cheap.
3. **Below Watched, everything you buy costs about 11% more.** Nobody gives a
   discount to a man he may have to explain later. This is the best small idea
   in the original and almost nobody notices it is there.
4. **It opens and closes doors** — ours, not theirs.

Climbing back is slow on purpose. Killing a raider is worth +1 and one blood run
costs several. You can be dragged down in a week and spend a season coming back.

### The gate — the fix for Space Trader's dead stat

| Warrant | Lawful settlements | Farms (Kell) |
|---|---|---|
| Bonded / Commended | Contracts. Steady, low margin, safe. | **Closed.** A bonded hauler is a Bureau informant. |
| Clean / Watched | Trade, watchfully | Trade, watchfully |
| Marked / Wanted | **Closed** | Best prices in the game |

The middle band is unstable by construction: every farm load drags you down,
every bounty pushes you up. You can straddle it for a while. You cannot live
there.

---

## Encounters, by valley

| | Colter | Vann | The Kell |
|---|---|---|---|
| Patrol | inspection, fee | inspection, sweep | roadblock |
| Raider | human, poor, desperate | human, armed, organised | **vampire** — faster, takes more killing, some of them talk |
| Hauler | trade, rumour | trade, contracts | trade, and they are frightened of you |
| Other | a family broken down | a truck done over in a way people do not do | a farm convoy |

**Vampires:** immortal, and that is all. No garlic, no invitation, no mist.
Weaker by day and still dangerous by day. Killable by ordinary means — which is
the only reason a bounty, a farm and an industry can exist at all.

What is horrifying about them is not power. It is duration and dependence: the
wrong immortality.

---

## The two farms

**Blood farms** make blood for vampires. **Fang farms** make vampires for
humans. Same industry, sometimes the same buildings; someone who stops producing
as a donor becomes stock.

Some farms are run by humans for profit. **Some are run by vampires**, who are
buying their own safety with their own kind's teeth — supply the Bureau and the
Bureau leaves you alone.

**And some vampires are fighting the farms.** Because the farms make people,
turn them, and kill them for the teeth; and because the farms keep the bounty
sustainable, which keeps the Bureau hunting everyone, including the ones who
have not hurt anybody in forty years.

The enemy is not a species.

---

## The Bureau

Not villainous. Its budget, checkpoints, licences and authority all exist
because of the problem. A managed supply justifies the apparatus, and nobody
inside it thinks of himself as wicked. The clerk who pays your bounty believes
he is doing his job, and he is.

This is why sabotage burns both ends.

---

## The checkpoint scene

Between Vann and the Kell. A Bureau weighing station where fangs are counted and
paid for. You queue forty minutes. There is a shed behind the office.

A man comes out of the shed wiping his hands, carrying a crate, and joins the
queue two trucks ahead of you. He is not hiding it. At a Bureau checkpoint, what
is in that crate is not illegal.

The clerk weighs it, pays him, stamps his book, and calls you forward.

No monologue. The horror is that it is paperwork.

**After this you cannot un-know it**, and every blood run for the rest of the
game is a different act than it was before, without one number changing.

---

## The three postures

| | Money | Crew | Warrant | Priest |
|---|---|---|---|---|
| **Serve the farms** | highest | hardens fastest | collapses | leaves, and tells you where he is going |
| **Serve the lawful** | slow, safe | static | climbs | stays, unused |
| **Sabotage** | none | holds together | collapses | his calls become the main work |

---

## Story beats

**Colter.** Learn the loop. A contract at Tolm opens Vann. Blood appears as
cargo through an intermediary at a drop point; you never meet a buyer. Both
priests are recruitable here, at different settlements, and you can only afford
one seat.

**Vann.** Money is real. Bureau posts pay for fangs. First evidence: a truck
done over in a way people do not do. The bounty schedule is published and
stable. You take the Kell road because the contract is too good.

**The checkpoint.**

**The Kell.** The port at Halloway sells berths. Ossett is lawful and poor.
Vire and Rook's End are farms. Pell is neither and will not say what it is. The
vampires fighting the farms make contact — mid-fight, and one of them talks, and
the shock is that it talks like a person, because it is one.

**The boat.** A berth is 500,000 and they sell one at a time. Nothing tells you
that buying a second one is the right answer, because nothing knows.

---

## What was decided

1. **The Coach** — rejected as written, and fixed rather than cut. One mount, one
   plating, a weaker frame. Four seats in a vehicle that cannot take a hit.
2. **Twelve crew** — cut to eight, plus Vist. Named above.
3. **Fighting counting half from everyone else** — kept. It is the reason the
   Coach exists, and it is the reason you carry Wace for four months before he
   is worth anything.
4. **The berths ending** — made quieter. No "buy five and start again". You can
   buy a spare and leave the name blank, and the ending reports it flatly with
   everything else.
5. **The sabotage path paying nothing** — kept. It is a vow, not a strategy, and
   it is allowed to be one.
6. **Andrej Vist, the earned crew member** — kept and built. He is not for hire.
   He comes down the bank on the Vire road once you have crossed at Ostrow and
   have never sold a tooth or taken a load through a farm gate. No wage, Fighting
   10, and a patrol that opens the back finds him. **Sarto gets down and shakes
   his hand. Kwiat asks him where he gets his blood, Vist says he does not know
   which farm, and Kwiat will not ride with him** — the same question he asks
   about your cargo, asked consistently, and it costs him something to ask it.

---

## What is in the first draft

Thirteen settlements on one continuous map, ten goods, seven local events, six
trucks, four mounts, three platings, six fittings, eight crew and Vist, Warrant
with the gate, patrols and raiders and haulers by valley, a combat loop, the
Rell licence, hardening, both priests, fangs on the Bureau schedule, the Ostrow
scene, and the boat. It saves to the browser.

**Not in yet:** sabotage as a playable path (it is named, not built), the
Doulton gun as an award, farm contracts as distinct jobs rather than ordinary
sales, and anything that happens to Vist after he is aboard beyond the
checkpoint.

**Numbers I expect to be wrong,** and would rather hear about from playing than
guess at: the raider rate in Colter, whether 500,000 is reachable in a sensible
number of days, whether the Coach is now too weak instead of too strong, and
whether hardening moves fast enough to be felt before the Kell.
