#!/usr/bin/env python3
"""
E2E test runner with different test scenarios.
"""
import os
import sys
import subprocess
import argparse
from pathlib import Path


def run_command(cmd: list, env: dict = None) -> int:
    """Run command and return exit code."""
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, env={**os.environ, **(env or {})})
    return result.returncode


def install_browsers():
    """Install Playwright browsers."""
    print("Installing Playwright browsers...")
    return run_command(["playwright", "install", "chromium"])


def run_tests(args):
    """Run E2E tests with specified configuration."""
    
    # Base pytest command
    cmd = ["pytest", "backend/tests/e2e"]
    
    # Environment variables
    env = {}
    
    # Test environment selection
    if args.railway:
        env["E2E_USE_RAILWAY"] = "true"
        print("Running tests against Railway deployment")
    else:
        print("Running tests against local environment")
    
    # Headless mode
    if args.headless:
        env["E2E_HEADLESS"] = "true"
    else:
        env["E2E_HEADLESS"] = "false"
        
    # Slow mode for debugging
    if args.slow:
        env["E2E_SLOW_MO"] = "500"  # 500ms between actions
    
    # Test selection
    if args.smoke:
        cmd.extend(["-m", "smoke"])
    elif args.critical:
        cmd.extend(["-m", "critical"])
    elif args.specific:
        cmd.extend(["-k", args.specific])
    elif args.file:
        cmd.append(f"backend/tests/e2e/{args.file}")
    
    # Parallel execution
    if args.parallel:
        cmd.extend(["-n", str(args.parallel)])
    
    # Verbose output
    if args.verbose:
        cmd.append("-vv")
    
    # Generate report
    if args.report:
        cmd.extend(["--html=test-report.html", "--self-contained-html"])
    
    # Stop on first failure
    if args.exitfirst:
        cmd.append("-x")
    
    # Run last failed tests
    if args.lf:
        cmd.append("--lf")
    
    return run_command(cmd, env)


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Run Cvety.kz E2E tests")
    
    # Environment options
    parser.add_argument(
        "--railway",
        action="store_true",
        help="Run tests against Railway deployment"
    )
    
    parser.add_argument(
        "--local",
        action="store_true",
        default=True,
        help="Run tests against local environment (default)"
    )
    
    # Display options
    parser.add_argument(
        "--headless",
        action="store_true",
        help="Run tests in headless mode"
    )
    
    parser.add_argument(
        "--slow",
        action="store_true",
        help="Run tests in slow mode for debugging"
    )
    
    # Test selection
    parser.add_argument(
        "--smoke",
        action="store_true",
        help="Run only smoke tests"
    )
    
    parser.add_argument(
        "--critical",
        action="store_true",
        help="Run only critical path tests"
    )
    
    parser.add_argument(
        "-k",
        "--specific",
        help="Run tests matching the given expression"
    )
    
    parser.add_argument(
        "-f",
        "--file",
        help="Run specific test file"
    )
    
    # Execution options
    parser.add_argument(
        "-n",
        "--parallel",
        type=int,
        help="Number of parallel workers"
    )
    
    parser.add_argument(
        "-v",
        "--verbose",
        action="store_true",
        help="Verbose output"
    )
    
    parser.add_argument(
        "--report",
        action="store_true",
        help="Generate HTML test report"
    )
    
    parser.add_argument(
        "-x",
        "--exitfirst",
        action="store_true",
        help="Exit on first test failure"
    )
    
    parser.add_argument(
        "--lf",
        action="store_true",
        help="Run last failed tests"
    )
    
    # Setup options
    parser.add_argument(
        "--install",
        action="store_true",
        help="Install Playwright browsers"
    )
    
    args = parser.parse_args()
    
    # Install browsers if requested
    if args.install:
        return install_browsers()
    
    # Run tests
    return run_tests(args)


if __name__ == "__main__":
    sys.exit(main())