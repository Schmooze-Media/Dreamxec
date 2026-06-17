/**
 * @param {Object} campaign 
 * @returns {Object} 
 */

const getCurrentMilestone = (campaign) => {
  if (campaign.currentMilestone === 0) {
    return {
      number: 0,
      title: "Launch Phase",
      isSystem: true, 
      endsAt: campaign.lpEndDate,
    };
  }

  // If the campaign has moved into execution 
  const milestone = campaign.milestones?.[campaign.currentMilestone - 1];

  if (!milestone) return null;

  return {
    ...milestone,
    number: campaign.currentMilestone,
    isSystem: false,
    endsAt: milestone.dueDate,
  };
};

module.exports = { getCurrentMilestone }