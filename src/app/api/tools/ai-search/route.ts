import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../lib/db';
import { errorResponse } from '../../lib/auth';
import { formatTool } from '../../lib/formatTool';
import { Tool } from '../../models/Tool';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

interface ToolSummary {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  tags: string[];
  features: string[];
  pricing: {
    type: string;
  };
  rating: number;
  views: number;
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const { query } = await req.json();
    
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Check if OpenAI API key is configured
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      // Fallback: Use semantic search without OpenAI
      return await semanticSearchFallback(query);
    }

    // Fetch all published tools. No .select() — the shared formatTool
    // helper needs the full doc shape (status, isTrending, etc.). 500
    // tools at ~2KB each is well under the route's memory budget.
    const tools = await Tool.find({
      status: { $in: ['published', 'approved'] }
    }).limit(500);

    if (tools.length === 0) {
      return NextResponse.json({ tools: [] });
    }

    // Prepare tool summaries for OpenAI
    const toolSummaries: ToolSummary[] = tools.map(tool => ({
      _id: tool._id.toString(),
      name: tool.name,
      slug: tool.slug,
      description: tool.description,
      description_ai: tool.description_ai,
      category: tool.category,
      tags: tool.tags || [],
      features: tool.features || [],
      pricing: {
        type: tool.pricing?.type || 'free'
      },
      rating: tool.rating || 0,
      views: tool.views || 0
    }));

    // Create a summary of tools for OpenAI
    const toolsContext = toolSummaries.map((tool, index) => 
      `${index + 1}. ${tool.name} (${tool.category}): ${tool.description}. Tags: ${tool.tags.join(', ')}. Features: ${tool.features.slice(0, 3).join(', ')}.`
    ).join('\n');

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using cost-effective model
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant that helps users find the best AI tools based on their needs. 
            Analyze the user's query and recommend the most relevant tools from the list provided.
            Return ONLY a JSON array of tool indices (numbers) that best match the query, ordered by relevance.
            Return between 3-8 tools. Format: [1, 5, 12, ...]`
          },
          {
            role: 'user',
            content: `User query: "${query}"

Available tools:
${toolsContext}

Return a JSON array of the most relevant tool indices (1-based) that match the user's query.`
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
    });

    if (!openaiResponse.ok) {
      console.error('OpenAI API error:', await openaiResponse.text());
      // Fallback to semantic search
      return await semanticSearchFallback(query);
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData.choices?.[0]?.message?.content || '';
    
    // Parse the JSON array from OpenAI response
    let selectedIndices: number[] = [];
    try {
      // Extract JSON array from response (handle markdown code blocks)
      const jsonMatch = content.match(/\[[\d,\s]+\]/);
      if (jsonMatch) {
        selectedIndices = JSON.parse(jsonMatch[0]).map((idx: number) => idx - 1); // Convert to 0-based
      }
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      // Fallback to semantic search
      return await semanticSearchFallback(query);
    }

    // Filter and return selected tools
    const recommendedIndices = selectedIndices
      .filter(idx => idx >= 0 && idx < toolSummaries.length)
      .slice(0, 8); // Limit to 8 tools

    // Get the selected tools from the original tools array
    const recommendedTools = recommendedIndices.map(idx => tools[idx]).filter(Boolean);

    const formattedTools = recommendedTools.map(formatTool);

    return NextResponse.json({ tools: formattedTools });

  } catch (error: unknown) {
    console.error('Error in AI search:', error);
    return errorResponse('Failed to search tools', 500);
  }
}

// Fallback semantic search when OpenAI is not available
async function semanticSearchFallback(query: string) {
  try {
    await connectDB();
    
    const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
    
    const tools = await Tool.find({
      status: { $in: ['published', 'approved'] },
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
        { tags: { $in: searchTerms } },
        { features: { $in: searchTerms } }
      ]
    })
      .sort({ rating: -1, views: -1 })
      .limit(8);

    const formattedTools = tools.map(formatTool);

    return NextResponse.json({ tools: formattedTools });
  } catch (error: unknown) {
    console.error('Error in fallback search:', error);
    return NextResponse.json({ tools: [] });
  }
}




