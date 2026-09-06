# Initial proof of concept

Status: first interactive slice implemented. The user authorized building a skeleton from the decisions below, with remaining details to be revisited after using it. See [first-slice notes](first-slice.md) for the provisional defaults and review topics.

## Purpose

Keep the workflow small enough to play with and tweak the interface. More complex arrangements and CAD export are later concerns.

## Requirements stated by the user

- One restricted rectangular room with controllable dimensions.
- A stage and a seating area are always present, with controllable footprints.
- The seating area's rise angle is controllable.
- An arbitrary number of point-source speakers can be placed anywhere in the space.
- A readout describes the speakers' coverage over the space.

## Accepted direction

- Use a basic heatmap of estimated direct SPL coverage, excluding room reflections initially. The user's later clarification establishes SPL across the seating/listening area as an initial-version requirement, developing the earlier relative-coverage proposal.
- The highest priority is showing coverage based on the HF driver's horizontal and vertical coverage angles.
- Treat the entered horizontal and vertical angles as full **−6 dB beamwidths** of a simplified, symmetric HF pattern. Apply smooth directional falloff through and beyond those limits rather than a hard coverage cutoff. For example, a **90° horizontal** pattern is **6 dB below on-axis** at **45° left or right** in its horizontal plane, at equal distance. Directional loss is additional to the speaker's output offset and distance loss.
- Combine speakers using **incoherent energy summation**. Two speakers each contributing **90 dB** at the same listening position produce approximately **93 dB combined** in this model. Phase cancellation and delay interactions do not alter the initial SPL calculation.
- Evaluate audience coverage on a prediction surface above the seating area, following its slope. Focus the heatmap and coverage statistics on this surface while retaining the room for placement.
- Provide selectable listening-height presets: **seated = 4 ft**, **standing = 5.5 ft**. Measure the offset vertically above the seating surface, not from the room floor or perpendicular to the slope. These exact feet values replace the earlier approximate 1.2 m suggestion.
- Model seating as one continuous slope. Its front edge nearest the stage starts at floor level, and the surface rises toward the back at the chosen angle. **0° means flat**; individual seating rows and steps are outside the initial scope.
- Intended settings include sloped amphitheaters and auditoriums, and flat conference rooms. **40 × 100 ft is only an example of a large corporate conference room or ballroom, not a minimum, maximum, or required default. Smaller and larger rooms must be supported.** These examples do not expand the initial rectangular-space constraint.
- Keep stage and seating footprints as rectangles aligned with the room, with editable width, depth, and position. The stage is movable anywhere within the room, rather than fixed against a wall; its facing direction remains along the room's length.
- Provide a dropdown for staging choices based initially on **4 × 8 ft** and **4 × 4 ft** panels. Special panel sizes can be added later.
- Keep overall stage width and depth freely editable. If the requested dimensions cannot be assembled from the supported standard panels, display a neutral **Custom** designation. Preserve the requested dimensions, proportional scale within the room, and normal movement/resizing. Do not force the stage into whole-panel increments or reject custom sizes. For example, a **10 × 14 ft** stage is accepted and labeled **Custom**.
- Add placeable tables: **8 ft round**, **6 ft rectangular**, and **8 ft rectangular**. The requested round-table dimension is retained as supplied; rectangular-table widths and placement controls remain to be specified.
- Tables serve as visual layout objects and **do not affect acoustic prediction in the first version**. Acoustic effects of people and items on tables are likewise outside the initial prediction. Evaluate SPL across the continuous seating/listening surface.
- Support the requested direction toward selectable event presets for concerts, corporate speaker events, and corporate dinners. Preset contents, behavior, and whether preset selection belongs in the first POC remain to be resolved.
- Enter a **peak SPL rating at 1 metre** for each speaker and apply an individually adjustable **output offset**. The initial offset is **−6 dB**; **0 dB** selects estimated peak output. The reference output used before distance and directional losses is peak SPL plus the signed offset.
- Provide a menu preference for the **default output offset**, including the ability to use **0 dB** as the starting value. The default supplies the starting value for newly added speakers; each placed speaker has its own adjustable offset. Settings persistence and any bulk application to existing speakers remain to be specified.
- Treat the −6 dB default as the chosen planning assumption for this simplified prediction, not as a universal conversion from every manufacturer's peak rating to a measured operating SPL.
- Eventually allow information from real speaker models to be entered and recalled as reusable speaker profiles. A manufacturer library is not a prerequisite for beginning the interface proof of concept.

## Editing workflow

- Use a **top-down plan** to drag objects, adjust speaker location and horizontal aim, and inspect the SPL heatmap.
- Provide a **linked side view for the selected speaker** to adjust speaker height and vertical aim while viewing the seating slope and listening surface.
- Provide a **properties panel** for precise numeric dimensions, positions, HF coverage angles, peak SPL, and output offset.
- Keep both views synchronized as the layout or speaker parameters change.
- Each speaker's room position, height, horizontal aim, and vertical aim are independently adjustable.
- The user-facing **speaker height locates the top of the cabinet**, rather than specifying a driver position. The first slice provisionally uses the common room floor as zero and the cabinet top as its point source. A separate HF-source offset remains a review topic.

## Future prediction capabilities

- Frequency-specific SPL coverage at **100 Hz, 250 Hz, 500 Hz, 1 kHz, 2 kHz, 4 kHz, and 8 kHz**, retaining the frequencies requested by the user.
- Use manufacturer measurement files, such as **GLL**, to inform those predictions. File import and frequency-specific modeling are future work, not initial-version requirements. No parser, integration, or data-access approach has been chosen.
- Keep phase cancellation, comb filtering, and delay-interaction simulation open for later development; complicated interaction calculations are outside the initial program's scope.

## Overlap advisory

Include an optional **Overlap advisory** layer in the initial POC, **hidden by default**. It helps non-specialists identify overlapping speaker coverage worth reviewing for potential interference. It leaves the incoherent SPL result unchanged.

Focus on the overlap of direct coverage zones. At each listening position, identify the two strongest predicted speaker contributions. Highlight the position when **both speakers cover it within their nominal HF zones** and their individual predicted levels are **within 6 dB of each other**. For example, **90 dB and 87 dB** qualify, while **90 dB and 75 dB** do not. Compare the strongest contributions at that position, rather than selecting a quieter pair beneath a dominant speaker.

This is a screening rule for overlap worth reviewing. The advisory does not calculate cancellation, rank actual interference severity, or locate reflection problems. **Reflection hotspots are deferred.** Its visual presentation remains to be agreed.

## Open decisions

The interview is paused in favor of trying the interface. Review the provisional choices in [first-slice notes](first-slice.md) before defining a second slice. Table dimensions, event-preset behavior, real speaker/profile geometry, placement constraints, and storage are still open product decisions.

## Reference notes

Manufacturer specifications distinguish nominal coverage from maximum output ratings. Reference distance and measurement conditions matter when interpreting peak SPL; they should accompany future speaker-profile data. This observation does not yet choose an SPL model for the proof of concept. [QSC product reference guide](https://www.qsc.com/resource-files/brochures/q_br_sys_pocketreferenceguide.pdf)

AFMG describes GLL as a loudspeaker model format supporting frequency-dependent directional and phase data, with additional configuration information. Future use will require investigation beyond treating it as a table of nominal coverage angles. [AFMG GLL format](https://www.afmg.eu/en/gll-loudspeaker-file-format)

Published beamwidths can describe the −6 dB coverage limits relative to on-axis output. This directional reduction is distinct from the user-selected output offset below peak; it is the accepted generic POC pattern convention. [JBL AC28/95 beamwidth specifications](https://jblpro.com/en-US/site_elements/ac28-95-spec-sheet), [QSC prediction coverage lines](https://sysnavhelp.qscaudio.com/v1/Content/MainMenu/AIM/AIM_Edit_Venue.htm)

EASE Focus distinguishes incoherent power summation, which disregards phase and relative propagation delay, from coherent complex summation. Incoherent power summation is the accepted approach for the initial combined-speaker map. [EASE Focus 3 user guide, summation settings](https://www.afmg.eu/sites/default/files/2021-09/EASE%20Focus%203%20User%27s%20Guide.pdf)

Overlapping loudspeaker coverage can be relevant to comb filtering, but predicting reflections involves additional room-acoustic analysis. These sources support distinguishing an overlap advisory from simulated interference and reflection results. [QSC multiple-loudspeaker comb filtering](https://support.qscaudio.com/sound-advice-%7C-how-to-avoid-comb-filtering-part-4-multiple-loudspeakers), [AFMG mapping with reflections](https://www.afmg.eu/en/show-me-how-use-standard-mapping-reflections)

## Process

Record accepted vocabulary in `CONTEXT.md` and scope decisions here. The user's explicit request to build the interactive skeleton authorized implementation with reasonable provisional choices; resume the documentation interview after hands-on feedback.
