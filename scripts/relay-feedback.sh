#!/bin/bash
# Script to be invoked by cron or Jenkins (or manually) for the purpose
# of copying the accumulated feedback.txt file to a more central and persistent location
#
# Dependencies:
# - SSH pubkey for the invoking server (monarch-app-beta or monarch-app-prod) must be installed
#   on the TARGETUSER@TARGETHOST, in the SSH authorized_keys file
# - There must be a ~/feedback/ directory present on the target
#
# Example crontab:
#       SHELL=/bin/bash
#       MAILTO=""
#       # m h dom mon dow usercommand
#       # * * * * * /opt/monarch-app/scripts/relay-feedback.sh        # Runs every minute
#       # */5 * * * * /opt/monarch-app/scripts/relay-feedback.sh      # Runs every 5 minutes
#       */30 * * * * /opt/monarch-app/scripts/relay-feedback.sh      # Runs every 30 minutes (enabled)
#       # 0 */2 * * * /opt/monarch-app/scripts/relay-feedback.sh      # Runs every two hours
#       # 0 */6 * * * /opt/monarch-app/scripts/relay-feedback.sh      # Runs every six hours
#

FEEDBACKFILE=/opt/monarch-app/feedback.txt
HOST=$(hostname)
TIMESTAMP=$(date "+%Y.%m.%d-%H.%M.%S")
TARGETHOST=monarch-access.monarchinitiative.org
TARGETUSER=dkeith
TARGETFILE=feedback/${HOST}-${TIMESTAMP}.txt
TARGETSCP=${TARGETUSER}@${TARGETHOST}:${TARGETFILE}

if test -f "${FEEDBACKFILE}"; then
    scp ${FEEDBACKFILE} ${TARGETSCP}
fi
