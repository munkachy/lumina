# Scriptorium script format

A ChoiceScript-like plain-text format, parsed in the browser. Deliberately not
ChoiceScript: that licence forbids commercial use without a 25% revenue share.

## Files

`startup.txt` declares variables and the scene order. Every other `.txt` file in
`scenes/` is a scene, played in the order `*scene_list` gives.

## Commands

    *create <var> <value>      declare a variable (startup only)
    *temp <var> <value>        scene-local variable
    *set <var> <expr>          assign; `%+n` / `%-n` are fairmath
    *if / *elseif / *else      conditionals, indented blocks
    *label <name>              a jump target
    *goto <label>              jump within the scene
    *goto_scene <scene>        jump to another scene
    *finish                    end scene, continue to the next
    *page_break                new screen
    *choice                    options follow as `#` lines, indented
    *image <file> <alt>        illustration, lazy-loaded, framed
    *ward <field> <value>      set a field in the ward panel
    *achieve <name>            award an achievement
    *ending                    final screen

## Fairmath

`*set valor %+20` adds 20% of the distance to 100, so a stat near the top moves
little and a stat near the bottom moves a lot. It never reaches 0 or 100. This
is what keeps ten numbers meaningful across 26,000 words.

## Improvements over ChoiceScript

- `*test <stat> <hi> <mid> <lo>` — graduated outcomes in one line instead of a
  hand-written if/elseif ladder.
- Two stat subjects: `*set` writes the angel's column, `*ward` writes Adam's.
- Tabs and spaces both accepted; the parser names the line that broke.
- Autosave every scene plus named slots.
- A choice ledger the player can review.
