import sys

with open('app.js', 'r') as f:
    content = f.read()

# Fix startAssessment
old_start = """    } catch (error) {
        loader.cleanup();
        console.error('❌ Error starting assessment:', error);
        showError('Failed to generate assessment questions. Please try again.');
        elements.startBtn.disabled = false;
        elements.startBtn.textContent = 'Assess My Skill Level';
    }"""

new_start = """    } catch (error) {
        loader.cleanup();
        console.error('❌ Error starting assessment:', error);

        elements.questionContainer.innerHTML = `
            <div class="error-state neo-brutal-card" style="padding: 40px; text-align: center; background: white; border: 4px solid black; box-shadow: 8px 8px 0px black;">
                <div style="font-size: 64px; margin-bottom: 20px;">🚨</div>
                <h3 class="neo-brutal-title" style="margin-bottom: 16px;">Assessment Generation Failed</h3>
                <p style="margin-bottom: 24px; font-weight: 500;">${error.message || 'The AI was unable to generate questions at this time.'}</p>
                <div style="display: flex; gap: 16px; justify-content: center;">
                    <button onclick="startAssessment()" class="btn btn-primary" style="background: var(--primary-v3); color: white; border: 3px solid black; padding: 12px 24px; font-weight: bold; cursor: pointer; box-shadow: 4px 4px 0px black;">Try Again</button>
                    <button onclick="showSection('homeSection')" class="btn btn-secondary" style="background: white; color: black; border: 3px solid black; padding: 12px 24px; font-weight: bold; cursor: pointer; box-shadow: 4px 4px 0px black;">Go Back</button>
                </div>
            </div>
        `;

        showError('Failed to generate assessment questions. Please try again.');
        elements.startBtn.disabled = false;
        elements.startBtn.textContent = 'Assess My Skill Level';
    }"""

# Fix proceedToEvaluation
old_eval = """    } catch (error) {
        loader.cleanup();
        evaluationContainer.innerHTML = originalContent;
        console.error('Error evaluating assessment:', error);
        if (error.status === 429) {
            showError('The AI service is currently at capacity. Please wait a few minutes or provide your own Groq API key in Settings for priority access.');
        } else {
            showError('Failed to evaluate assessment. Please try again.');
        }
    }"""

new_eval = """    } catch (error) {
        loader.cleanup();
        console.error('Error evaluating assessment:', error);

        evaluationContainer.innerHTML = `
            <div class="error-state neo-brutal-card" style="padding: 40px; text-align: center; background: white; border: 4px solid black; box-shadow: 8px 8px 0px black;">
                <div style="font-size: 64px; margin-bottom: 20px;">📊</div>
                <h3 class="neo-brutal-title" style="margin-bottom: 16px;">Evaluation Failed</h3>
                <p style="margin-bottom: 24px; font-weight: 500;">${error.message || 'The AI was unable to evaluate your assessment.'}</p>
                <div style="display: flex; gap: 16px; justify-content: center;">
                    <button onclick="proceedToEvaluation()" class="btn btn-primary" style="background: var(--primary-v3); color: white; border: 3px solid black; padding: 12px 24px; font-weight: bold; cursor: pointer; box-shadow: 4px 4px 0px black;">Retry Evaluation</button>
                    <button onclick="showSection('assessmentSection')" class="btn btn-secondary" style="background: white; color: black; border: 3px solid black; padding: 12px 24px; font-weight: bold; cursor: pointer; box-shadow: 4px 4px 0px black;">Return to Assessment</button>
                </div>
            </div>
        `;

        if (error.status === 429) {
            showError('The AI service is currently at capacity. Please wait a few minutes or provide your own Groq API key in Settings for priority access.');
        } else {
            showError('Failed to evaluate assessment. Please try again.');
        }
    }"""

content = content.replace(old_start, new_start)
content = content.replace(old_eval, new_eval)

with open('app.js', 'w') as f:
    f.write(content)
