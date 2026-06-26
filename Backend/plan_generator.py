import re

def parse_duration_to_weeks(duration_str: str) -> int:
    """Parses a user-provided duration string into number of weeks."""
    if not duration_str:
        return 8
    
    # Try to find numbers
    match = re.search(r'(\d+)', duration_str)
    if not match:
        return 8
    
    val = int(match.group(1))
    lower_str = duration_str.lower()
    
    if "month" in lower_str:
        return val * 4
    elif "year" in lower_str:
        return val * 52
    elif "day" in lower_str:
        return max(1, val // 7)
    # Default is weeks
    return val

def generate_custom_plan(tech_to_learn: str, proficiency: str, goal: str, duration_type: str, duration: str = None) -> list:
    # Determine number of weeks
    if duration_type == "ai_suggest":
        prof_lower = proficiency.lower()
        if "very new" in prof_lower or "scratch" in prof_lower:
            num_weeks = 12
        elif "beginner" in prof_lower:
            num_weeks = 8
        elif "intermediate" in prof_lower:
            num_weeks = 6
        else: # Advanced
            num_weeks = 4
    else:
        num_weeks = parse_duration_to_weeks(duration)
        if num_weeks < 1:
            num_weeks = 1
        elif num_weeks > 24:
            num_weeks = 24  # Cap it at 24 weeks for usability

    # Normalize tech name
    tech_key = tech_to_learn.lower().strip()
    
    # Base curricula outline templates
    curricula = {
        "react": [
            "Modern JavaScript Foundations (ES6+, Async/Await)",
            "Introduction to React, JSX, and Component Architecture",
            "State Management with useState and Prop Drilling",
            "Handling Effects and API Integration with useEffect",
            "Advanced Hooks (useMemo, useCallback, useRef)",
            "Routing with React Router and Navigation layouts",
            "Global State Management (Redux Toolkit or Context API)",
            "Styling in React (Tailwind CSS, Styled Components)",
            "Performance Optimization and Component Testing (Jest/RTL)",
            "Deploying React Applications (Vercel, Netlify) & CI/CD",
            "Advanced React Patterns (Render Props, HOCs, Compound Components)",
            "Building a Full-Scale React Portfolio Project"
        ],
        "python": [
            "Python Basics, Syntax, Variables & Basic Operators",
            "Control Flow (If-Else, Loops) & Data Structures (Lists, Tuples)",
            "Dictionaries, Sets, and File Input/Output Operations",
            "Functions, Scope, and Lambda Expressions",
            "Object-Oriented Programming (OOP) in Python",
            "Exception Handling, Debugging, and Testing with unittest",
            "Working with Databases (SQLAlchemy, SQLite/PostgreSQL)",
            "Introduction to Web APIs (FastAPI or Flask basics)",
            "Concurrency in Python (Multithreading, Asyncio)",
            "Data Analysis Foundations (Pandas, NumPy basics)",
            "Building and Packaging Python Applications",
            "Final Project: End-to-end Python Backend Service"
        ],
        "javascript": [
            "JavaScript Core Syntax, Types, and Variable Scope",
            "Arrays, Objects, and Functions (Arrow Functions, Callbacks)",
            "DOM Manipulation and Browser Event Handling",
            "Asynchronous JavaScript (Promises, Async/Await, Fetch API)",
            "Object-Oriented JavaScript and Prototypal Inheritance",
            "Modules (ES6 Modules, CommonJS) and Build Tools (Vite/Webpack)",
            "Local Storage, Session Storage, and Cookies",
            "Advanced JS Concepts (Closures, Event Loop, Debouncing)",
            "Unit Testing with Jest",
            "Introduction to Node.js and Express server basics",
            "Security Best Practices in Web Development",
            "Final Capstone: Dynamic Interactive SPA"
        ],
        "devops": [
            "Linux Administration, Shell Scripting, and CLI Basics",
            "Git version control, Branching Strategies, and Collaboration",
            "Containerization Basics with Docker (Dockerfiles, Docker Compose)",
            "Continuous Integration (CI) with GitHub Actions or Jenkins",
            "Continuous Deployment (CD) and Pipeline Orchestration",
            "Infrastructure as Code (IaC) with Terraform basics",
            "Cloud Infrastructure Management (AWS/GCP core services)",
            "Monitoring & Logging Tools (Prometheus, Grafana, ELK)",
            "Configuration Management with Ansible",
            "Orchestration with Kubernetes (Pods, Services, Deployments)",
            "DevOps Security & DevSecOps practices",
            "Final Capstone: Fully Automated CI/CD Cloud Deployment"
        ],
        "cloud": [
            "Cloud Computing Fundamentals (IaaS, PaaS, SaaS Overview)",
            "AWS Core Services: Compute (EC2, Lambda) and Networking (VPC)",
            "Cloud Storage Options (S3, EBS, RDS, DynamoDB)",
            "Identity & Access Management (IAM) and Security Policies",
            "Serverless Architecture and Application Services",
            "Infrastructure Deployment Automation (CloudFormation/Terraform)",
            "High Availability, Scalability, and Load Balancing (ELB, ASG)",
            "Cloud Monitoring, Logging, and Cost Optimization",
            "Hybrid Cloud Implementations & Networking (Direct Connect, VPN)",
            "Container Deployments in Cloud (ECS, EKS)",
            "Disaster Recovery and Backup Strategies",
            "Final Capstone: Scalable Multi-Tier Cloud Application"
        ]
    }
    
    # Select template or default
    matched_curriculum = None
    for key, cur in curricula.items():
        if key in tech_key:
            matched_curriculum = cur
            break
            
    if not matched_curriculum:
        # Generic Template based on tech name
        matched_curriculum = [
            f"Foundations of {tech_to_learn} & Development Environment Setup",
            f"Core Concepts and Syntax of {tech_to_learn}",
            f"Control Structures and Basic Programming with {tech_to_learn}",
            f"Functions, Modules, and Reusability in {tech_to_learn}",
            f"Data Structures and Collections in {tech_to_learn}",
            f"Working with APIs and External Services in {tech_to_learn}",
            f"Advanced features & Design Patterns of {tech_to_learn}",
            f"Database integration & ORM with {tech_to_learn}",
            f"Testing, Debugging, and Code Quality in {tech_to_learn}",
            f"Performance Optimization and Scaling {tech_to_learn}",
            f"Security Best Practices for {tech_to_learn} Projects",
            f"Capstone Project development using {tech_to_learn}"
        ]

    # Map the curriculum topics into the requested number of weeks
    plan = []
    
    for i in range(num_weeks):
        week_num = i + 1
        
        # Calculate cursor mapping
        ratio_start = int((i / num_weeks) * len(matched_curriculum))
        ratio_end = int(((i + 1) / num_weeks) * len(matched_curriculum))
        if ratio_end == ratio_start:
            ratio_end = ratio_start + 1
        
        # Guard limits
        ratio_start = min(ratio_start, len(matched_curriculum) - 1)
        ratio_end = min(max(ratio_end, ratio_start + 1), len(matched_curriculum))
        
        week_topics_source = matched_curriculum[ratio_start:ratio_end]
        title = week_topics_source[0] if week_topics_source else f"Module {week_num}"
        
        # Sub-topics
        sub_topics = []
        for src in week_topics_source:
            sub_topics.append(src)
        
        # Create details
        milestone = f"Complete milestone project for {title.split(' (')[0]}"
        
        tasks = [
            f"Read official documentation on {title}",
            f"Code hands-on exercises matching {title}",
            f"Push practice code to Git repository",
            f"Resolve challenges relating to {title}"
        ]
        
        plan.append({
            "week": f"Week {week_num}",
            "title": title,
            "topics": sub_topics,
            "milestone": milestone,
            "tasks": tasks
        })
        
    return plan
