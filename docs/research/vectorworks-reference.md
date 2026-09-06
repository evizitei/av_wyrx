# Vectorworks reference for a small AV space mapper

Researched 2026-09-05 against official Vectorworks documentation, primarily the English 2026 help. This note records reference behavior, not a committed product specification or implementation plan.

## Product scope

The wider family includes Fundamentals for general precision 2D/3D drafting and modeling, Architect for building BIM and construction documentation, and Landmark for landscape/site design. These provide context; this project's closest domain is entertainment and AV. [Fundamentals](https://www.vectorworks.net/en-US/fundamentals), [Architect](https://www.vectorworks.net/en-US/architect), [Landmark](https://www.vectorworks.net/en-US/landmark)

Vectorworks is a product family. For this project, the closest references are **Spotlight** for the physical event/AV layout and **ConnectCAD** for the connected AV system. Spotlight's event workflow covers venue geometry, seating, stages, equipment placement, views, and documentation. ConnectCAD adds schematic devices and signal flow, equipment/rack layouts, cable routes, and related reports. [Designing events](https://app-help.vectorworks.net/2026/eng/VW2026_Guide/EventDesign1/Designing_events.htm), [ConnectCAD overview](https://app-help.vectorworks.net/2026/eng/VW2026_Guide/ConnectCAD/ConnectCAD.htm)

The particularly relevant precedent is Spotlight's **Basic event design** workflow, explicitly aimed at small events such as banquets and training sessions. It creates rooms, stages and steps, lecterns, screens, and seating, then produces views and chair/table reports. [Basic event design](https://app-help.vectorworks.net/2026/eng/VW2026_Guide/EventDesign1/Basic_event_design.htm)

## Core spatial and drafting experience

- **Start with a measured room or an existing plan.** A closed rectangle, polygon, or polyline can define a room's interior outline; wall height and thickness produce connected walls and a slab. The broader event workflow can begin by importing a PDF, DXF/DWG, or SketchUp venue plan, scaling it, and tracing relevant geometry. [Creating the room for a basic event](https://app-help.vectorworks.net/2026/eng/VW2026_Guide/EventDesign1/Creating%20the_room_for_a_basic_event.htm), [Designing events](https://app-help.vectorworks.net/2026/eng/VW2026_Guide/EventDesign1/Designing_events.htm)
- **Place and edit precisely.** SmartCursor snapping includes grids, objects, angles, and intersections. The Object Info palette exposes object geometry, position, class/layer assignment, attached records/IFC data, and rendering settings; it also supports editing multiple selected objects. [Snapping parameters](https://app-help.vectorworks.net/2026/eng/VW2026_Guide/Basic2/Setting%20snapping%20parameters.htm), [Object Info palette](https://app-help.vectorworks.net/2026/eng/VW2026_Guide/Objects_edit1/The_Object_Info_palette.htm)
- **Organize model content separately from presentation.** Design layers contain geometry and can have elevations. Sheet layers carry presentation viewports, notes, and title blocks. Classes categorize objects across layers and control visibility and graphics; they correspond more closely to AutoCAD layers. [Layers overview](https://app-help.vectorworks.net/2026/eng/VW2026_Guide/Structure/Concept_Layers%20overview.htm), [Classes overview](https://app-help.vectorworks.net/2026/eng/VW2026_Guide/Structure/Concept_Classes_overview.htm)
- **Use the same layout for different views.** Basic event commands create 2D plan and shaded isometric sheet views. This connects a working space layout to understandable presentation documents. [Creating basic event views](https://app-help.vectorworks.net/2026/eng/VW2026_Guide/EventDesign1/Creating_basic_event_views.htm)
- **Reuse equipment definitions.** Symbols separate a reusable definition from placed instances with their own coordinates and rotation. Hybrid symbols have 2D Top/Plan and 3D representations; instance records can feed worksheets. World-based dimensions and page-based annotation sizes are distinct concepts. [Symbols](https://app-help.vectorworks.net/2026/eng/VW2026_Guide/Symbols/Concept_Vectorworks_symbols.htm), [Page/world units](https://app-help.vectorworks.net/2026/eng/VW2026_Guide/Attributes/Concept__Page-based_and_world-based_units.htm)

## Spotlight: AV objects and physical layout

**Speakers** can be placed from detailed symbols, simpler catalog geometry, or generic custom dimensions. They carry brand/model, dimensions, weight, power and impedance information, plus horizontal/vertical dispersion and throw-distance parameters. Placement includes position and rotation; support, labeling, numbering, and rigging attachment are supported. The documented dispersion geometry is useful for understanding intended coverage; this source does not establish full room-acoustics simulation. [Inserting speakers](https://app-help.vectorworks.net/2026/eng/VW2026_Guide/EventDesign2/Inserting_speakers.htm)

**Video objects** include televisions, projectors, screens, blended projection screens, and LED walls. Spotlight assists with placement, image size, and viewing-area calculations; objects can display an image and calculated labels, and some show an optimum viewing area. [Inserting video screen objects](https://app-help.vectorworks.net/2026/eng/VW2026_Guide/EventDesign2/Inserting_video_screen_objects.htm)

The event environment also includes cameras and lighting devices that can be associated with ConnectCAD equipment items. In the 2026 equipment workflow, a physical equipment item may be generic, symbol-based, or selected by category and make/model. Its data includes dimensions, power, weight, and location. [Placing equipment](https://app-help.vectorworks.net/2026/eng/VW2026_Guide/ConnectCAD/Placing_equipment.htm)

## ConnectCAD: schematic connectivity and cabling

ConnectCAD maintains related but distinct representations:

| Representation | Meaning |
| --- | --- |
| Device, sockets, and circuits | Logical signal-flow schematic: which endpoint connects to which endpoint. A circuit's drawn path is not its real-world cable route. |
| Equipment layout | Physical equipment positions, including scaled rack and console layouts. |
| Cable-route network | Physical paths through a floor plan or model, used for route analysis and cable-length estimates. |

These distinctions are explicit in the [ConnectCAD overview](https://app-help.vectorworks.net/2026/eng/VW2026_Guide/ConnectCAD/ConnectCAD.htm) and [Spotlight/ConnectCAD terminology](https://app-help.vectorworks.net/2026/eng/VW2026_Guide/ConnectCAD/Spotlight_and_ConnectCAD_terminology.htm).

An explicit physical cable is optional for a circuit. One cable can carry several circuits, and an explicit cable can override automatic route assignment. Spotlight's cable path guides physical cables; ConnectCAD's cable paths form a route network for schematic circuits. This is a consequential distinction for any later simplified connection feature: a connection line and a measured cable run need not mean the same thing. The last sentence is a project inference. [Terminology](https://app-help.vectorworks.net/2026/eng/VW2026_Guide/ConnectCAD/Spotlight_and_ConnectCAD_terminology.htm)

Equipment items can be free-standing or rack-mounted. Rack items inherit rack identity/location, move with it, and snap to rack-unit or slot positions. Equipment can associate with a schematic device and with a Spotlight camera, speaker, light, or screen. In 2026, equipment's 3D symbol definitions contain device-definition records describing corresponding schematic characteristics and connectivity. [Placing equipment](https://app-help.vectorworks.net/2026/eng/VW2026_Guide/ConnectCAD/Placing_equipment.htm)

ConnectCAD also offers live error checking, reusable templates and symbols, and as-built documentation. These extend it beyond drawing a visual wiring diagram. [ConnectCAD product overview](https://www.vectorworks.net/en-US/connectcad)

## Inventories, labeling, and reporting

Spotlight tracks equipment placed in the drawing and compares it with inventory sources such as warehouses, venues, or vendors. Counts can include object subparts and additional items that are not drawn as physical geometry. Equipment lists can become filtered or comprehensive editable worksheets, while an Equipment Summary Key presents a graphical count/legend on the drawing. [Inventory and equipment lists](https://app-help.vectorworks.net/2026/eng/VW2026_Guide/LightingDesign2/Concept_Inventory_and_equipment_lists.htm)

ConnectCAD reports include all/current-layer circuit reports, cable-pull counts and types by route, parts lists, device lists, and device-to-socket connection reports. Two-way worksheet editing can update drawing data from a report. This means the source model supplies installation paperwork as well as graphics. [Creating ConnectCAD reports](https://app-help.vectorworks.net/2026/eng/VW2026_Guide/ConnectCAD/Creating_ConnectCAD_reports.htm?agt=index)

## Interchange and future export considerations

| Format | Verified Vectorworks support and practical meaning |
| --- | --- |
| **DXF/DWG** | Import is part of the venue workflow; export supports design and sheet content. Symbols, plug-ins, and groups generally become blocks, with options to decompose them into geometry. Design layers export into model space; sheets usually become paper-space layouts. This preserves a useful CAD drawing, but does not establish preservation of native AV object behavior. [Event imports](https://app-help.vectorworks.net/2026/eng/VW2026_Guide/EventDesign1/Designing_events.htm), [DXF/DWG export behavior](https://app-help.vectorworks.net/2026/eng/VW2026_Guide/DXFDWG/DXF_DWG_and_DWF_file_export.htm) |
| **IFC** | Export supports IFC 2x3, 4, and 4x3, with `.ifc`, `.ifczip`, and `.ifcxml` containers. Geometry/data are selected through model-view definitions, and design layers are mapped to building stories. IFC4 Reference View is explicitly a reference model rather than native editable objects. [Exporting IFC projects](https://app-help.vectorworks.net/2026/eng/VW2026_Guide/IFC/Exporting_IFC_projects.htm) |
| **PDF** | Export creates printable/shareable pages from sheets or visible design layers. Layers/classes can become optional PDF layers, and linked objects can retain certain hyperlinks. PDF import is also a venue-reference workflow. These sources do not promise editable CAD semantics from PDF. [Exporting PDF files](https://app-help.vectorworks.net/2026/eng/VW2026_Guide/Export/Exporting_PDF_files.htm), [Event imports](https://app-help.vectorworks.net/2026/eng/VW2026_Guide/EventDesign1/Designing_events.htm) |
| **MVR / GDTF** | MVR exchanges lighting and scene designs with consoles/visualizers, including fixture data associated with GDTF. Vectorworks can merge scene changes back from MVR. MVR does not support 2D objects, so this is a specialized entertainment workflow rather than a general 2D plan handoff. [Exporting MVR](https://app-help.vectorworks.net/2026/eng/VW2026_Guide/Export/Exporting_MVR%20files.htm) |
| **SVG** | Native drawing interchange was **not verified** in the English 2026 documentation reviewed. SVG references found concerned interface icons, which do not establish drawing import/export support. Do not assume SVG is a Vectorworks handoff format. [Workspace icon formats](https://app-help.vectorworks.net/2026/eng/VW2026_Guide/Start/Modifying_commands_tools_in_workspace.htm) |

**Project inference:** DXF/DWG is a plausible future path for scaled plans and object geometry. A file that opens correctly in CAD and a file that reconstructs intelligent native Spotlight/ConnectCAD objects are different acceptance criteria. Units, origin, scale, object positions, names/categories, 2D versus 3D content, and retained metadata will need deliberate verification with actual exports and imports. The underlying evidence is Vectorworks' documented mapping/conversion behavior and its configurable export options. [DXF/DWG export options](https://app-help.vectorworks.net/2026/eng/VW2026_Guide/DXFDWG/DXF_DWG_and_DWF_export_options.htm)

## Optional adjacent capabilities

- **Showcase** is Spotlight's integrated previsualization environment for lights, video, and effects in the venue, including programming and cueing a show. [Showcase](https://app-help.vectorworks.net/2026/eng/VW2026_Guide/LightingDesign2/Concept__Showcase.htm)
- **Braceworks** adds analysis of temporary structures under load, including structural calculations and reports. It is a separate area from simply arranging a room or documenting AV equipment. [Braceworks](https://www.vectorworks.net/en-US/braceworks)
- **Vision** takes model/fixture information from Spotlight for lighting previsualization, programming, and cueing with a console. It is relevant to show operation rather than basic space mapping. [Vision](https://www.vectorworks.net/en-US/vision)

## Working understanding for this project

The relevant experience combines a measured space, placed equipment with meaningful properties, readable plan/3D views, labels and quantities, and optionally connections and cable routes. A much smaller product can select from those workflows without replicating the whole CAD, BIM, rigging-analysis, or show-previsualization environment. This is a synthesis for discussion, not an agreed feature list. Export can remain future work while the reference distinction between geometric interchange and native intelligent objects stays explicit.

These findings describe documented capabilities, not hands-on verification. Product entitlements and localized editions can differ; no licensing or pricing conclusions are needed here. SVG support remains unconfirmed. No application code or export implementation has been created.
