"""
Fair Matching Algorithm for SAMARTH.
Rule-based, explainable scoring engine connecting customer service requests with qualified local skilled workers.
"""

from decimal import Decimal
from .models import WorkerProfile, Booking, WorkerSkill

# Configurable matching weights summing to 1.0
MATCHING_WEIGHTS = {
    'skill': 0.35,
    'distance': 0.25,
    'availability': 0.20,
    'budget': 0.20,
}


def compute_skill_fit(worker, job_request):
    """
    Computes skill compatibility (0.0 - 1.0) and generates an explanation.
    Hard filter: Worker MUST have at least one skill registered in the requested category.
    """
    category_skills = worker.skills.filter(category=job_request.category)
    if not category_skills.exists():
        return 0.0, "Worker does not have registered skills in this category."

    skill_names = [s.skill_name.lower() for s in category_skills]
    request_text = f"{job_request.title} {job_request.description}".lower()

    # Base fit for possessing the primary category
    base_score = 0.70

    # Specific keyword / specialty match bonus
    matched_specific = [name for name in skill_names if any(word in request_text for word in name.split())]
    keyword_bonus = 0.15 if matched_specific else 0.05

    # Experience bonus (up to 0.15 for 5+ years)
    exp_bonus = min(worker.experience_years / 10.0, 0.15)

    score = min(round(base_score + keyword_bonus + exp_bonus, 2), 1.0)
    
    specialty_str = f" specializing in {', '.join([s.skill_name for s in category_skills[:2]])}" if category_skills else ""
    reason = f"Verified {job_request.category.name} expertise ({worker.experience_years} years exp){specialty_str}."
    return score, reason


def compute_distance_fit(worker, job_request):
    """
    Computes distance compatibility (0.0 - 1.0).
    Formula: max(0, 1 - distance / service_radius)
    Hard filter: Worker must be within their service radius.
    """
    distance = worker.calculate_distance_km(job_request.latitude, job_request.longitude)
    radius = max(worker.service_radius_km, 1.0)

    if distance > radius:
        return 0.0, f"Distance ({distance} km) exceeds worker's service radius ({radius} km).", distance

    fit = max(0.0, 1.0 - (distance / radius))
    score = round(fit, 2)
    reason = f"Located ~{distance} km away (well within service radius of {radius} km)."
    return score, reason, distance


def compute_availability_fit(worker, job_request):
    """
    Computes availability compatibility (0.0 - 1.0).
    Hard filter: Worker must have is_available=True and not be double-booked.
    """
    if not worker.is_available:
        return 0.0, "Worker is currently marked unavailable."

    # Check existing confirmed or in-progress bookings for the same date & time slot
    conflicts = Booking.objects.filter(
        worker=worker,
        scheduled_date=job_request.preferred_date,
        scheduled_slot=job_request.preferred_time_slot,
        status__in=[Booking.Status.CONFIRMED, Booking.Status.IN_PROGRESS]
    )

    if conflicts.exists():
        return 0.0, f"Worker already has a confirmed booking for {job_request.preferred_time_slot} on this date."

    score = 1.0
    reason = f"Available and open for {job_request.get_preferred_time_slot_display()} on {job_request.preferred_date}."
    return score, reason


def compute_budget_fit(worker, job_request):
    """
    Computes budget compatibility (0.0 - 1.0).
    Uses estimated standard 2-hour job cost based on worker's hourly rate.
    """
    estimated_cost = float(worker.hourly_rate) * 2.0
    b_min = float(job_request.budget_min)
    b_max = float(job_request.budget_max)

    # If within stated budget
    if b_min <= estimated_cost <= b_max:
        score = 1.0
        reason = f"Estimated job charge (~₹{int(estimated_cost)}) is squarely within your ₹{int(b_min)} - ₹{int(b_max)} budget."
        return score, reason

    # If lower than minimum budget: excellent value
    if estimated_cost < b_min:
        score = 0.95
        reason = f"Estimated job charge (~₹{int(estimated_cost)}) is very affordable (below ₹{int(b_min)})."
        return score, reason

    # If higher than max budget by up to 25%
    overage = estimated_cost - b_max
    allowed_tolerance = b_max * 0.25
    if overage <= allowed_tolerance:
        score = max(0.2, round(1.0 - (overage / allowed_tolerance) * 0.7, 2))
        reason = f"Estimated charge (~₹{int(estimated_cost)}) slightly exceeds budget max of ₹{int(b_max)}."
        return score, reason

    # Out of budget
    return 0.0, f"Estimated charge (~₹{int(estimated_cost)}) significantly exceeds stated maximum budget of ₹{int(b_max)}."


def find_matching_workers(job_request):
    """
    Finds and scores all eligible workers for a given JobRequest.
    Returns list of dicts with worker profile, total score (0-100), factor scores, and reasons.
    """
    # 1. Base eligibility filter: worker is active, verified or pending (excluding rejected)
    candidate_workers = WorkerProfile.objects.filter(
        is_available=True
    ).exclude(verification_status=WorkerProfile.VerificationStatus.REJECTED).select_related('user').prefetch_related('skills')

    matches = []

    for worker in candidate_workers:
        # Hard Filter 1: Skill category
        skill_score, skill_reason = compute_skill_fit(worker, job_request)
        if skill_score <= 0.0:
            continue

        # Hard Filter 2: Distance & Service radius
        dist_score, dist_reason, distance_km = compute_distance_fit(worker, job_request)
        if dist_score <= 0.0:
            continue

        # Hard Filter 3: Availability
        avail_score, avail_reason = compute_availability_fit(worker, job_request)
        if avail_score <= 0.0:
            continue

        # Hard Filter 4: Budget
        budget_score, budget_reason = compute_budget_fit(worker, job_request)
        if budget_score <= 0.0:
            continue

        # Explainable Overall Score calculation:
        # Score = 100 * (0.35 * skill_fit + 0.25 * distance_fit + 0.20 * availability_fit + 0.20 * budget_fit)
        total_score = 100.0 * (
            MATCHING_WEIGHTS['skill'] * skill_score +
            MATCHING_WEIGHTS['distance'] * dist_score +
            MATCHING_WEIGHTS['availability'] * avail_score +
            MATCHING_WEIGHTS['budget'] * budget_score
        )
        total_score = round(total_score, 1)

        reasons = [skill_reason, dist_reason, avail_reason, budget_reason]

        matches.append({
            'worker': worker,
            'total_score': total_score,
            'distance_km': distance_km,
            'factor_scores': {
                'skill_fit': round(skill_score * 100, 1),
                'distance_fit': round(dist_score * 100, 1),
                'availability_fit': round(avail_score * 100, 1),
                'budget_fit': round(budget_score * 100, 1),
            },
            'weights': MATCHING_WEIGHTS,
            'reasons': reasons
        })

    # Sort primarily by total matching score descending
    matches.sort(key=lambda x: x['total_score'], reverse=True)
    return matches
