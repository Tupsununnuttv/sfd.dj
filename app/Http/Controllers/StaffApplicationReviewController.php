<?php

namespace App\Http\Controllers;

use App\Models\StaffApplication;
use App\Support\DiscordStaffApplications;
use App\Support\StaffApplicationForm;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Admin panel → Applications: staff read the applications, move them through the review and keep private notes. Every action checks the permission here, not only in the interface. */
class StaffApplicationReviewController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->staff($request);
        $status = in_array($request->query('status'), array_keys(StaffApplication::STATUSES), true) ? $request->query('status') : null;
        $position = in_array($request->query('position'), StaffApplicationForm::POSITIONS, true) ? $request->query('position') : null;

        return response()->json([
            'applications' => StaffApplication::with('user:id,name,username')
                ->when($status, fn ($q) => $q->where('status', $status))
                ->when($position, fn ($q) => $q->where('position', $position))
                ->orderByRaw("status in ('pending', 'under_review') desc")->orderByDesc('id')->limit(100)->get()->map->summary()->values(),
            'counts' => StaffApplication::selectRaw('status, count(*) as n')->groupBy('status')->pluck('n', 'status')->all() + array_fill_keys(array_keys(StaffApplication::STATUSES), 0),
            'statuses' => StaffApplication::STATUSES,
            'positions' => StaffApplicationForm::POSITIONS,
            'sections' => StaffApplicationForm::SECTIONS,
        ]);
    }

    public function show(Request $request, StaffApplication $application): JsonResponse
    {
        $this->staff($request);

        return response()->json($application->detail());
    }

    public function update(Request $request, StaffApplication $application): JsonResponse
    {
        $staff = $this->staff($request);
        $data = $request->validate([
            'status' => ['sometimes', Rule::in(array_keys(StaffApplication::STATUSES))],
            'staff_notes' => ['sometimes', 'nullable', 'string', 'max:3000'],
        ]);

        if (array_key_exists('staff_notes', $data)) {
            $application->update(['staff_notes' => $data['staff_notes']]);
        }
        $note = null;
        if (isset($data['status']) && $application->setStatus($data['status'], $staff)) {
            $note = DiscordStaffApplications::afterStatusChange($application);
        }

        return response()->json(['application' => $application->detail(), 'notice' => $note]);
    }

    private function staff(Request $request)
    {
        abort_unless($request->user()?->hasPermission('applications.manage'), 403);

        return $request->user();
    }
}
