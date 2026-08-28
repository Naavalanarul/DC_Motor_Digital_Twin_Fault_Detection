"""
Reference standards used by the paper:

Prainetr, S., Wangnippanto, S., Tunyasirut, S. (2017).
"Detection Mechanical Fault of Induction Motor Using Harmonic Current and
Sound Acoustic." 5th International Electrical Engineering Congress,
Pattaya, Thailand, 8-10 March 2017.

Table I. Standard alignment setup of induction motor
    Speed (rpm)     Parallel Offset (mm.)   Angularity (mm.)
    Up to 1500      0.05                    0.06
    1500 to 3000    0.025                   0.04
    Over 3000       0.013                   0.02

The paper drives its whole experiment off this table: motors are tested at
normal alignment and then deliberately misaligned to 0.05 mm, 0.10 mm and
0.20 mm to see how far outside the standard's tolerance they are pushed
(Sec. III.B / IV.A). The original repo instead used an abstract, unitless
"severity" slider (0.0-0.5) with no connection to a physical offset in mm,
so a "severity of 0.05" could not be interpreted against any real
acceptance standard. This module lets the app classify a physical
misalignment in mm against Table I, and maps that to the severity index
the simulator actually uses.
"""

# (max_rpm, parallel_offset_mm, angularity_mm)
ALIGNMENT_TABLE = [
    (1500, 0.05, 0.06),
    (3000, 0.025, 0.04),
    (float("inf"), 0.013, 0.02),
]

# Reference points the paper actually tested experimentally (Sec. IV.A/B):
# normal alignment, then 0.05 mm, 0.10 mm and 0.20 mm parallel misalignment.
TESTED_OFFSETS_MM = [0.0, 0.05, 0.10, 0.20]

# Paper Sec. IV.D: acoustic spectral peak reference values.
ACOUSTIC_HEALTHY_PEAK_HZ = 157.2
ACOUSTIC_FAULT_LIMIT_HZ = 625.0


def allowed_offset_mm(speed_rpm: float) -> dict:
    """Look up the Table I allowed parallel offset / angularity for a given
    rotor speed in rpm."""
    for max_rpm, offset_mm, angularity_mm in ALIGNMENT_TABLE:
        if speed_rpm <= max_rpm:
            return {"parallel_offset_mm": offset_mm, "angularity_mm": angularity_mm}
    return ALIGNMENT_TABLE[-1]


def classify_offset(speed_rpm: float, measured_offset_mm: float) -> str:
    """Classify a measured parallel offset against Table I for the given
    speed. Returns 'within_standard', 'marginal' (1x-4x tolerance, matching
    the paper's 0.05/0.10/0.20 mm test points) or 'severe'."""
    limits = allowed_offset_mm(speed_rpm)
    tol = limits["parallel_offset_mm"]
    if measured_offset_mm <= tol:
        return "within_standard"
    elif measured_offset_mm <= 4 * tol:
        return "marginal"
    return "severe"


def offset_mm_to_severity_index(offset_mm: float, tol_mm: float = 0.05) -> float:
    """
    Map a physical misalignment (mm) onto the simulator's unitless
    static/dynamic severity index, normalized so that the standard's own
    tolerance (0.05 mm at up-to-1500 rpm, per Table I) corresponds to a
    severity of 1.0 x the tolerance boundary, matching the paper's own
    0.05/0.10/0.20 mm test ladder (i.e. 0.10 mm -> 2x, 0.20 mm -> 4x).
    The result is clamped to the simulator's [0, 0.5] slider range.
    """
    if tol_mm <= 0:
        return 0.0
    ratio = offset_mm / tol_mm
    # Scale so that 0.20 mm (4x tolerance, the paper's worst tested case)
    # lands near the top of the severity slider range (0.5).
    severity = min(0.5, 0.125 * ratio)
    return severity
