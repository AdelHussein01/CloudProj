from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Image,
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from build_report import create_architecture_diagram, create_pipeline_diagram, ensure_dirs


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "outputs" / "final"
PDF = OUT / "cloud-native-gitops-report.pdf"

TEAM_MEMBERS = [
    ("Ammar Darwish", "73226"),
    ("Djonacy Sigawuke Jr", "74294"),
    ("Adel Hussein", "73405"),
    ("Daniel Kandemiri", "73506"),
    ("Assil Sediri", "73476"),
]


def styles():
    base = getSampleStyleSheet()
    base.add(
        ParagraphStyle(
            name="ReportTitle",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=24,
            leading=29,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#0B2545"),
            spaceAfter=10,
        )
    )
    base.add(
        ParagraphStyle(
            name="Subtitle",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=11,
            leading=15,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#475569"),
            spaceAfter=14,
        )
    )
    base["Heading1"].fontName = "Helvetica-Bold"
    base["Heading1"].fontSize = 16
    base["Heading1"].leading = 20
    base["Heading1"].textColor = colors.HexColor("#2E74B5")
    base["Heading1"].spaceBefore = 12
    base["Heading1"].spaceAfter = 8
    base["Heading2"].fontName = "Helvetica-Bold"
    base["Heading2"].fontSize = 13
    base["Heading2"].leading = 16
    base["Heading2"].textColor = colors.HexColor("#1F4D78")
    base["BodyText"].fontName = "Helvetica"
    base["BodyText"].fontSize = 10.4
    base["BodyText"].leading = 14.2
    base["BodyText"].spaceAfter = 7
    return base


def bullet_list(items: list[str], style) -> ListFlowable:
    return ListFlowable(
        [ListItem(Paragraph(item, style), bulletColor=colors.HexColor("#2E74B5")) for item in items],
        bulletType="bullet",
        start="circle",
        leftIndent=18,
        bulletFontSize=8,
    )


def numbered_list(items: list[str], style) -> ListFlowable:
    return ListFlowable(
        [ListItem(Paragraph(item, style)) for item in items],
        bulletType="1",
        leftIndent=22,
    )


def table(headers: list[str], rows: list[list[str]], style) -> Table:
    data = [[Paragraph(f"<b>{header}</b>", style) for header in headers]]
    for row in rows:
        data.append([Paragraph(cell, style) for cell in row])
    widths = [6.5 * inch / len(headers)] * len(headers)
    tbl = Table(data, colWidths=widths, repeatRows=1)
    tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E8EEF5")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#0B2545")),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CBD5E1")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return tbl


def team_table(style) -> Table:
    data = [[Paragraph("<b>Student Name</b>", style), Paragraph("<b>Student ID</b>", style)]]
    data.extend([[Paragraph(name, style), Paragraph(student_id, style)] for name, student_id in TEAM_MEMBERS])
    tbl = Table(data, colWidths=[4.8 * inch, 1.7 * inch], repeatRows=1)
    tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E8EEF5")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#0B2545")),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CBD5E1")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return tbl


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#64748B"))
    canvas.drawString(inch, 0.45 * inch, "Cloud-Native CI/CD Pipelines with GitOps")
    canvas.drawRightString(7.5 * inch, 0.45 * inch, f"Page {doc.page}")
    canvas.restoreState()


def build_pdf() -> Path:
    ensure_dirs()
    arch = create_architecture_diagram()
    pipe = create_pipeline_diagram()
    st = styles()
    story = []

    story.append(Paragraph("Cloud-Native CI/CD Pipelines with GitOps", st["ReportTitle"]))
    story.append(
        Paragraph(
            "Next.js + NestJS real-time game platform deployed with GitHub Actions, ArgoCD, and AWS EKS",
            st["Subtitle"],
        )
    )
    story.append(Paragraph("<b>Repository:</b> https://github.com/AdelHussein01/CloudProj", st["BodyText"]))
    story.append(Spacer(1, 8))
    story.append(Paragraph("<b>Team Members</b>", st["BodyText"]))
    story.append(team_table(st["BodyText"]))
    story.append(Spacer(1, 12))

    sections = [
        (
            "Executive Summary",
            [
                "This project implements a GitOps-based CI/CD pipeline for a cloud-native two-player game platform. The application lets a host create a private link, choose XO or rock-paper-scissors, and invite the first user who opens the link to join the selected game in real time.",
                "The technical goal is to show how declarative infrastructure, immutable image promotion, automated testing, secure secret management, rollback, and observability combine into a reliable delivery workflow.",
            ],
        ),
        (
            "Project Scope",
            [
                "Application: Next.js frontend and NestJS Socket.IO API.",
                "CI: GitHub Actions for type checks, tests, builds, Docker image publishing, and image scanning.",
                "CD: ArgoCD watches Helm manifests and reconciles AWS EKS to the Git-declared desired state.",
                "Secrets: AWS Secrets Manager, External Secrets Operator, and IAM Roles for Service Accounts.",
                "Rollback: Git revert or a controlled rollback workflow that commits known-good image tags.",
                "AWS execution is intentionally left as the final phase to protect account access and control cost.",
            ],
        ),
    ]
    for title, items in sections:
        story.append(Paragraph(title, st["Heading1"]))
        if title == "Project Scope":
            story.append(bullet_list(items, st["BodyText"]))
        else:
            for item in items:
                story.append(Paragraph(item, st["BodyText"]))

    story.append(Paragraph("System Architecture", st["Heading1"]))
    story.append(Image(str(arch), width=6.5 * inch, height=3.53 * inch))
    story.append(Paragraph("The architecture separates CI from CD. GitHub Actions validates code and promotes immutable image tags to Git, while ArgoCD performs cluster reconciliation from inside Kubernetes.", st["BodyText"]))

    story.append(Paragraph("Application Design", st["Heading1"]))
    story.append(
        table(
            ["Layer", "Technology", "Responsibility"],
            [
                ["Web", "Next.js", "Room creation, share links, join screen, XO board, RPS rounds, responsive UI."],
                ["API", "NestJS + Socket.IO", "Real-time rooms, player state, game validation, broadcasts, health endpoint."],
                ["Packaging", "Docker", "Separate production images for web and API."],
                ["Runtime", "Kubernetes", "Deployments, services, ingress, probes, resources, and optional autoscaling."],
            ],
            st["BodyText"],
        )
    )
    story.append(Paragraph("The API stores room state in memory and therefore starts with one API replica for the demo. A production version should add Redis or another shared state backend before horizontal API scaling.", st["BodyText"]))

    story.append(PageBreak())
    story.append(Paragraph("CI/CD Pipeline", st["Heading1"]))
    story.append(Image(str(pipe), width=6.5 * inch, height=2.41 * inch))
    story.append(
        numbered_list(
            [
                "A developer opens a pull request.",
                "GitHub Actions runs type checks, tests, and production builds.",
                "After merge to main, Docker images are built and pushed to GitHub Container Registry.",
                "Images are tagged with the commit SHA to preserve immutability.",
                "Trivy scans the images and blocks high or critical vulnerabilities.",
                "The release workflow commits updated Helm image tags.",
                "ArgoCD detects the Git change and syncs AWS EKS.",
            ],
            st["BodyText"],
        )
    )

    story.append(Paragraph("GitOps vs Traditional CI/CD", st["Heading1"]))
    story.append(
        table(
            ["Area", "Traditional CI/CD", "GitOps in This Project"],
            [
                ["Deployment actor", "Pipeline pushes to the cluster.", "ArgoCD pulls desired state from Git."],
                ["Source of truth", "Pipeline state and live cluster can diverge.", "Git stores the declared runtime state."],
                ["Rollback", "Re-run a pipeline or manually deploy an older artifact.", "Revert Git or commit previous immutable tags."],
                ["Drift handling", "Manual checks or periodic audits.", "ArgoCD detects and self-heals drift."],
                ["Audit trail", "Pipeline logs plus release notes.", "Git history plus ArgoCD sync history."],
            ],
            st["BodyText"],
        )
    )

    story.append(Paragraph("Security and Secret Management", st["Heading1"]))
    story.append(
        bullet_list(
            [
                "No raw secrets are committed to Git.",
                "GitHub Actions uses scoped permissions for CI, package publishing, and rollback.",
                "Runtime secrets are stored in AWS Secrets Manager and synced by External Secrets Operator.",
                "External Secrets authenticates through IRSA, avoiding static AWS keys in pods.",
                "Image tags use commit SHAs, not mutable production tags.",
                "Container images are scanned before promotion.",
            ],
            st["BodyText"],
        )
    )

    story.append(PageBreak())
    story.append(Paragraph("Rollback Strategy", st["Heading1"]))
    story.append(Paragraph("The preferred rollback is a Git operation. Reverting the GitOps promotion commit or running the manual rollback workflow updates Helm values with known-good image tags. ArgoCD then reconciles the cluster to that older declared state.", st["BodyText"]))
    story.append(
        bullet_list(
            [
                "Fast rollback path: run the rollback workflow with previous sha-* image tags.",
                "Audit-friendly rollback path: revert the bad promotion commit.",
                "Avoid cluster-only rollback because it creates drift between Git and Kubernetes.",
            ],
            st["BodyText"],
        )
    )

    story.append(Paragraph("Observability and Evaluation", st["Heading1"]))
    story.append(
        table(
            ["Metric", "Purpose", "How to Measure"],
            [
                ["Deployment frequency", "Shows release throughput.", "Count successful release workflow runs."],
                ["Lead time", "Measures merge-to-production speed.", "Time from merge to healthy ArgoCD sync."],
                ["Change failure rate", "Measures deployment quality.", "Failed deployments divided by total deployments."],
                ["MTTR", "Measures recovery speed.", "Time from bad release detection to healthy rollback."],
                ["Drift repair time", "Measures GitOps self-healing.", "Time from manual cluster drift to ArgoCD correction."],
            ],
            st["BodyText"],
        )
    )

    story.append(Paragraph("Demo Plan", st["Heading1"]))
    story.append(
        numbered_list(
            [
                "Open the deployed application.",
                "Create an XO room and copy the share link.",
                "Join from a second browser and finish an XO match.",
                "Create a rock-paper-scissors room and play multiple rounds.",
                "Open GitHub Actions and show CI and release workflows.",
                "Open ArgoCD and show sync status and application health.",
                "Create controlled drift by scaling the web deployment and show ArgoCD self-healing.",
                "Run the rollback workflow or revert a promotion commit and verify the older version is restored.",
            ],
            st["BodyText"],
        )
    )

    story.append(Paragraph("AWS Final Phase", st["Heading1"]))
    story.append(Paragraph("AWS deployment should be performed last. This avoids exposing credentials early, gives time to review the project artifacts, and allows the team to confirm cost and cleanup expectations before creating paid cloud resources.", st["BodyText"]))
    story.append(
        bullet_list(
            [
                "Create EKS infrastructure with Terraform.",
                "Install AWS Load Balancer Controller, External Secrets Operator, and ArgoCD.",
                "Create the required AWS Secrets Manager entry.",
                "Apply ArgoCD manifests and verify the application sync.",
                "Use a real domain or the AWS ALB DNS name for the demo.",
            ],
            st["BodyText"],
        )
    )

    story.append(Paragraph("Conclusion", st["Heading1"]))
    story.append(Paragraph("GitOps improves reliability by making Git the system of record for deployment state. In this project, every deployment and rollback is traceable, automated, and reproducible. The main engineering risks are cloud IAM setup, secret handling, and state sharing for real-time WebSocket workloads.", st["BodyText"]))
    story.append(Paragraph("References", st["Heading1"]))
    story.append(
        bullet_list(
            [
                "Amazon EKS User Guide: https://docs.aws.amazon.com/eks/latest/userguide/",
                "AWS Load Balancer Controller on EKS: https://docs.aws.amazon.com/eks/latest/userguide/lbc-helm.html",
                "ArgoCD documentation: https://argo-cd.readthedocs.io/",
                "GitHub Actions documentation: https://docs.github.com/en/actions",
                "GitHub Container Registry documentation: https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry",
                "External Secrets Operator documentation: https://external-secrets.io/",
            ],
            st["BodyText"],
        )
    )

    doc = SimpleDocTemplate(
        str(PDF),
        pagesize=letter,
        rightMargin=inch,
        leftMargin=inch,
        topMargin=0.8 * inch,
        bottomMargin=0.75 * inch,
        title="Cloud-Native CI/CD Pipelines with GitOps",
    )
    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    return PDF


if __name__ == "__main__":
    print(build_pdf())
