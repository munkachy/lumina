# NIGHTFREIGHT — design document

**Nothing is built yet. This is the document to argue with.**

A trading game on the Space Trader chassis. The economy, the encounter loop and
the two reputation scales are the proven 2002 design, matched close to
one-to-one. The innovation is the three valleys and what is being hauled.

---

## Pitch

You drive a truck between settlements in a country where the nights are not
safe, and the most profitable cargo is blood, and nobody will tell you where it
comes from.

**Win condition:** 500,000 and a berth on the boat at Halloway, which is the
only way out of the country. **The berths are sold one at a time.** You can buy
one, or you can buy five and start again from nothing.

---

## What is copied from Space Trader, deliberately

| System | Original | Ours |
|---|---|---|
| Skills | Pilot, Fighter, Trader, Engineer (1–10) | **Driving, Fighting, Dealing, Mending** (1–10) |
| Crew | ship has 1–3 crew slots; 31 mercenaries carry the same skills | truck has 1–4 **seats**; 12 recruitable crew |
| Vehicle | 15 ships: cargo / weapon / shield / gadget / crew / fuel / hull | 6 trucks: cargo / mounts / plating / fittings / seats / fuel / frame |
| Weapons | 4 lasers, power 10/15/25/40 | 4 mounts, same power curve |
| Shields | 3, power 20/35/50 | 3 platings, same |
| Gadgets | 6 | 6 fittings, same prices |
| Goods | 10, price 30–5000, demand tied to local events | 10, same shape |
| Contraband | Narcotics and Firearms, **legality set per government** | **Blood and Ammunition, legality set per settlement** |
| Reputation | two scales: police record −70…+75, combat 0…1500 | **Warrant** and **Renown**, same ranges |
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

**Fangs are not a trade good.** They are sold to Bureau posts at a published
schedule price, fresh worth more than old. Selling raises Warrant.

**Local events:** quiet · siege · fever · hard frost · crop failure · a strike ·
a hunt (Bureau sweep).

---

## The truck

| Truck | Cargo | Seats | Mounts | Plating | Fittings | Fuel | Frame | Price |
|---|---|---|---|---|---|---|---|---|
| Panel van | 10 | 1 | 0 | 0 | 0 | 14 | 4 | start |
| Flatbed | 15 | 2 | 1 | 0 | 1 | 16 | 5 | 10,000 |
| Box truck | 25 | 2 | 1 | 1 | 2 | 15 | 5 | 30,000 |
| **Coach** | 20 | **4** | 2 | 2 | 2 | 14 | 5 | 75,000 |
| Hauler | 45 | 3 | 2 | 2 | 3 | 13 | 6 | 150,000 |
| Armoured hauler | 35 | 3 | 3 | 3 | 3 | 12 | 8 | 300,000 |

The Coach is the interesting one: worst cargo-per-credit in the game, and the
only truck that carries four people. It is the truck you buy if you have decided
what this year is for.

**Mounts** (power 10 / 15 / 25 / 40): shotgun rack 2,000 · rifle mount 12,500 ·
heavy mount 35,000 · the Doulton gun 50,000 (not for sale).

**Plating** (20 / 35 / 50): mesh 5,000 · plate 20,000 · plate and mesh 45,000.

**Fittings**: roof rack (+5 cargo) 2,500 · toolkit (auto-repair) 7,500 · maps and
radio 15,000 · floodlights (night targeting) 25,000 · muffled engine (run dark)
100,000 · long tank 30,000.

---

## Crew — twelve, four skills each, one trait

Every seat is a crate you are not carrying. That is the whole cost model.

| | Dri | Fig | Dea | Men | Trait |
|---|---|---|---|---|---|
| **Ivar Sull**, ex-haulage | 8 | 2 | 4 | 3 | Will not drive at night for any money |
| **Beck**, ex-Bureau | 4 | 7 | 3 | 2 | Checkpoints cost half; settlements distrust you |
| **Ruta Kelm**, buyer | 2 | 1 | 9 | 2 | Reads a market; refuses to haggle over medicine |
| **Ollie Frame**, mechanic | 3 | 2 | 2 | 9 | Fixes anything; drinks |
| **Sten**, raider turned | 6 | 8 | 2 | 3 | Hardens fastest of anyone |
| **Marya Doust**, nurse | 3 | 2 | 4 | 7 | Mends people, not trucks. Will not ride on ammunition |
| **Corin Wace**, boy | 5 | 3 | 3 | 4 | Learns — gains a point every six weeks, up to 7 |
| **Halda Vey**, night driver | 9 | 3 | 2 | 2 | Only takes night contracts. Expensive |
| **Tomasz**, quiet | 5 | 6 | 5 | 5 | No weakness and no edge. Never leaves |
| **Nessa Roan**, smuggler | 6 | 4 | 7 | 2 | Halves the Warrant cost of a blood run |
| **Fr. Emil Sarto** | 2 | 1 | 3 | 4 | *see below* |
| **Fr. Jan Kwiat** | 1 | 1 | 2 | 5 | *see below* |

**Hardening.** Crew have a state: *steady → hard → gone*. Fang hunting and
night fighting harden them. Hardened crew fight better, take less, and start
refusing the priest's calls. Only a priest moves them back. He takes a seat.

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

## Warrant and Renown

**Warrant** (their police record, −70…+75):
Wanted −50 · Marked −20 · Watched −5 · **Clean 0** · Licensed +10 · Bonded +30 ·
Commended +60

**Renown** (their combat reputation, 0…1500):
Unknown 0 · Known 20 · Steady 80 · Solid 150 · Hard 300 · Feared 600 · A Name 1500

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

**The boat.** 500,000 and a berth. Berths sell one at a time.

---

## What I would like you to reject

1. **The Coach.** Four seats and terrible cargo is the most interesting truck in
   the table, and it may be so obviously the "good" choice that it flattens the
   decision.
2. **Twelve crew may be four too many** for a first build. Eight would be
   testable and still feel like a roster.
3. **Renown may be dead weight.** Space Trader's combat reputation mostly just
   scares pirates off. If Warrant is carrying the real decisions, Renown might be
   one scale too many.
4. **The berths ending.** Buying five berths instead of one is a strong final
   beat and it is also the kind of thing that can read as the game telling you
   what the right answer was. It may want to be quieter than that.
5. **Whether the sabotage path can pay at all.** Right now it pays nothing, which
   makes it a vow rather than a strategy. That might be correct. It might also
   mean nobody plays it.
