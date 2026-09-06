# First interactive slice

The user ended the interview and authorized an interactive skeleton so subsequent decisions can be informed by using the interface. This slice implements the accepted direction and makes the remaining choices provisional. Its purpose is to test whether the paired plan/side-view workflow feels useful.

## Implemented

- Room width/depth; freely sized, room-aligned stage and seating rectangles; editable positions; a continuous seating ramp; 4 ft seated and 5.5 ft standing prediction surfaces.
- Standard stage recognition using 4 × 4 ft or 4 × 8 ft panels (including rotated panels), with exact custom footprints retained. A preferred panel format and estimated count are displayed for standard footprints.
- Any number of generic point-source speakers, with editable position, cabinet-top height, horizontal aim, downward tilt, HF horizontal/vertical beamwidths, peak SPL at 1 metre, and output offset.
- A −6 dB starting offset, individual adjustment to 0 dB, and a menu preference for newly added speakers. Duplicating a speaker copies its existing settings.
- Live sampled direct-SPL heatmap; minimum, median and maximum; point readout; optional overlap hatching and overlap-area percentage.
- Linked side section through the selected speaker's horizontal aiming direction, showing the seating ramp, listening surface, cabinet-top source, and vertical beam. Height and tilt handles are interactive.
- Round and rectangular table footprints with drag, duplicate, remove, and rectangular-table rotation controls. Tables do not change prediction.
- Three editable starting layouts, muting, undo/redo, zoom, pan, and fit-to-room.

## Provisional choices made to get an interface running

These are implementation defaults for this slice, not outcomes of the earlier interview.

| Choice | First-slice behavior |
| --- | --- |
| Speaker elevation | Common room floor is zero. The cabinet top is also the point-source origin; no HF offset input yet. |
| Generic speaker | Default 130 dB peak at 1 metre, 90° horizontal / 60° vertical; editable per speaker. The starting layouts use illustrative positioning and aiming. |
| HF pattern | Smooth quadratic loss in horizontal and vertical off-axis angles, adding the two dB losses. Each principal-plane half-beamwidth gives −6 dB. The nominal zone is the combined directional-loss contour at 6 dB. Loss is capped at 80 dB for the generic rear/off-axis tail. |
| Distance | 20 log10 distance loss using metres, capped at the 1-metre reference for points closer than 1 metre. |
| Stage elevation | A simple editable platform height for the side view, starting at 2 ft for Conference/Dinner and 3 ft for Concert. It has no acoustic obstruction effect. |
| Rectangular tables | 6 × 2.5 ft and 8 × 2.5 ft; the requested round table is 8 ft in diameter. These widths are provisional. |
| Presets | Complete example layouts applied once, followed by free editing. Selecting one replaces the current study and can be undone. There is no automatic arrangement or seat generation. |
| Geometry limits | Room dimensions 4–1,000 ft, seating rise 0–35°, top heights 0–200 ft, HF beamwidths 10–180°, tilt −85–85°. These are temporary editor bounds. |
| Placement | Footprints and speakers are kept inside the room. Shrinking the room clamps stage/seating size and location. Tables retain their standard size; a room resize that cannot fit the tables is rejected. Stage, seating, and table footprints may overlap. |
| Precision | Drag position snaps to 0.25 ft; footprint corner resizing to 0.5 ft; angles to 1°. Numeric entry permits finer positions/dimensions. |
| Color scale | Fixed 65–110 dB legend by default, adjustable in Settings. Out-of-range levels retain their numeric values while colors saturate. |
| Side drawing | Horizontal and vertical scales fit the available view independently. Read axis labels and angle values rather than measuring angles on screen. |
| Storage | Everything is in memory. Reload resets the study and preferences. No save/load, backend, manufacturer library, or export. |

## Verification performed

- Syntax checks and seven focused model tests pass.
- Browser checks cover exact custom stage dimensions, listener-height switching, speaker addition and configurable default offset, individual controls, acoustic neutrality of tables, muting all speakers, and starting-layout selection.
- Direct pointer checks confirm plan dragging, horizontal aiming, and side-view height/tilt controls update coordinates and predictions.
- The layout was inspected and adjusted for the narrow in-app browser panel. No browser console errors were observed during these checks.

## Candidates for the next documentation pass

Use the interface before deciding which of these belong in the next slice:

- Whether the plan/side split, inspector layout, handles, and numeric controls make placement intuitive.
- The top-of-cabinet reference, real cabinet geometry, local platform height, and HF-source offset.
- Which readouts best express useful coverage, including legend bounds, target SPL bands, and overlap presentation.
- Furniture widths, placement/rotation, and the difference between example layouts, saved presets, and automatic arrangement.
- Save/load and preference persistence; reusable speaker profiles and manufacturer data provenance.
- Geometry boundaries, overlapping footprints, units, and keyboard/snapping behavior.

Frequency-band prediction, GLL integration, coherent summation, phase/delay interactions, reflection hotspots, and CAD interchange remain later capabilities.
