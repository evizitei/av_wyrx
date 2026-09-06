# AV Space Planning

The language used to describe a space, its performance and audience areas, and the speakers serving it.

## Language

**Room**:
The rectangular space within which the layout is arranged.
_Avoid_: Venue, when referring only to this bounded space.

**Stage**:
The rectangular performance area within the room. It remains aligned with the room and can be positioned anywhere within it.

**Stage panel**:
An individual rectangular staging module used to form a stage. The initial panel sizes are 4 × 8 ft and 4 × 4 ft.
_Avoid_: Stage, when referring to one panel rather than the overall performance area.

**Custom stage**:
A stage whose overall dimensions cannot be assembled from the supported standard stage panels. It remains a valid, movable rectangular stage at its specified dimensions.
_Avoid_: Invalid stage, since custom dimensions are permitted.

**Seating area**:
The area occupied by the audience, represented by one continuous surface with a room-aligned rectangular footprint and rise angle. Its front edge nearest the stage is at floor level, and it rises toward the back.
_Avoid_: Seating section, when referring to this same area.

**Rise angle**:
The angle of the seating surface above horizontal, rising from its front edge toward its back edge. A rise angle of 0° describes flat seating.
_Avoid_: Listening height, which is an offset above the seating surface rather than its slope.

**Footprint**:
The outline and dimensions of an area's projection onto the horizontal floor plane.

**Table**:
A furniture item placed within the room for visual layout planning. Its presence does not alter the initial acoustic prediction.

**Listening height**:
The vertical distance from the seating surface to the audience's ears. The seated preset is 4 ft and the standing preset is 5.5 ft.
_Avoid_: Speaker height, which locates the sound source rather than the listener.

**Prediction surface**:
The surface on which audience coverage is evaluated, positioned at the selected listening height vertically above the seating surface and following its slope.
_Avoid_: Room floor, when referring to the locations at which audience coverage is calculated.

**HF coverage angles**:
The full horizontal and vertical −6 dB beamwidths of a speaker's high-frequency output, centered on its aiming direction in the simplified model. Each beamwidth spans the directions where the level is 6 dB below the on-axis level in that plane.
_Avoid_: Splay, when referring to the dispersion of a single speaker rather than the angle between speakers.

**Directional loss**:
The reduction in a speaker's predicted level caused by a listener being off its aiming axis, evaluated separately from distance loss and the speaker's output offset. In the simplified model it varies smoothly through and beyond the nominal coverage limits.

**Coverage zone**:
The portion of the prediction surface within a speaker's nominal HF coverage pattern. Predicted sound can extend beyond this zone because directional loss is gradual.

**Direct sound**:
Sound traveling from a speaker to a receiving position without reflecting off room surfaces.

**Direct SPL estimate**:
The estimated sound pressure level at a position on the prediction surface from direct speaker output. The initial estimate uses simplified speaker information rather than frequency-specific manufacturer measurements.

**Incoherent summation**:
Combining the sound energies contributed by multiple speakers at a listening position without modeling relative phase or arrival-time interference. This is the basis of the initial combined SPL map.
_Avoid_: Phase prediction, which would require a different treatment of speaker interaction.

**Overlap advisory**:
An optional view that highlights overlapping speaker coverage worth reviewing for potential interference. It does not change the SPL estimate or predict actual cancellation, delay interactions, or reflections.
_Avoid_: Phase cancellation map, which would imply calculated interference results.

**Peak SPL rating**:
A speaker's specified maximum sound pressure level under stated measurement conditions and at a stated reference distance. It is distinct from the output level selected for a particular prediction.

**Output offset**:
The signed adjustment applied to a speaker's peak SPL rating to set its reference output for prediction. An offset of −6 dB means 6 dB below peak, and 0 dB means peak output.
_Avoid_: HF coverage loss, which describes a separate reduction due to listening direction.

**Default output offset**:
The user's preferred starting output offset for newly added speakers. Its initial value is −6 dB.

**Speaker profile**:
A reusable set of specifications describing a speaker model, including its HF coverage angles and any supplied output rating.
_Avoid_: Speaker placement, which describes a particular speaker's location and orientation in the room.

**Speaker placement**:
An individual speaker positioned in the room, with its own location, height, horizontal aim, vertical aim, and output offset.
_Avoid_: Speaker profile, which describes reusable speaker specifications.

**Speaker height**:
The placement elevation of the top of the speaker cabinet. It is distinct from the cabinet's physical height and the position of its HF source.
_Avoid_: HF source height, when referring to the user's cabinet-top placement measurement.

**Horizontal aim**:
The direction a speaker faces in the horizontal plane.
_Avoid_: Horizontal coverage angle, which describes the spread of its output around that direction.

**Vertical aim**:
The upward or downward angle of a speaker's aiming direction relative to horizontal.
_Avoid_: Vertical coverage angle, which describes the spread of its output around that direction.
